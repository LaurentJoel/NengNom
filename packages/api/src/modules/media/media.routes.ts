import { FastifyInstance } from 'fastify'
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary'
import { config } from '../../config/env.js'

cloudinary.config({
  cloud_name: config.CLOUDINARY_CLOUD_NAME,
  api_key: config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET,
})

const ALLOWED_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'video/mp4', 'video/quicktime', 'video/webm',
])
const MAX_FILES      = 5
const MAX_FILE_BYTES = 50 * 1024 * 1024 // 50 MB

function streamToCloudinary(
  stream: NodeJS.ReadableStream,
  resourceType: 'image' | 'video',
): Promise<string> {
  return new Promise((resolve, reject) => {
    const options = {
      resource_type: resourceType as 'image' | 'video',
      folder: 'neng-nom/community',
      ...(resourceType === 'image' && {
        transformation: [{ quality: 'auto', fetch_format: 'auto', width: 1080, crop: 'limit' }],
      }),
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (err: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (err || !result) reject(err ?? new Error('Upload failed'))
        else resolve(result.secure_url)
      },
    )

    stream.pipe(uploadStream)
  })
}

export async function mediaRoutes(fastify: FastifyInstance) {
  /**
   * POST /media/upload
   * Accepts up to 5 multipart files (images or videos).
   * Streams each directly to Cloudinary and returns their secure URLs.
   */
  fastify.post(
    '/media/upload',
    {
      preHandler: [fastify.authenticate],
      schema: { tags: ['Media'], summary: 'Upload media files (images / videos) to Cloudinary' },
    },
    async (request, reply) => {
      const parts = request.files({
        limits: { files: MAX_FILES, fileSize: MAX_FILE_BYTES },
      })

      const urls: string[] = []

      for await (const part of parts) {
        if (!ALLOWED_TYPES.has(part.mimetype)) {
          return reply.status(400).send({
            success: false,
            error: {
              code: 'UNSUPPORTED_MEDIA_TYPE',
              message: `File type "${part.mimetype}" is not allowed. Use JPEG, PNG, WebP, GIF, MP4, MOV, or WebM.`,
            },
          })
        }

        const resourceType = part.mimetype.startsWith('video/') ? 'video' : 'image'
        const url = await streamToCloudinary(part.file, resourceType)
        urls.push(url)
      }

      return reply.send({ success: true, data: { urls } })
    },
  )
}
