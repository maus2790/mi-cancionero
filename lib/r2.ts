import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || 'mock';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || 'mock';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || 'mock';
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'mock';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || '';

// Cliente S3 para R2 con endpoint correcto
const s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
});

export const generateImageKey = (chordId: number, extension: string = 'png') => {
    const hash = crypto.randomBytes(16).toString('hex');
    return `acordes/${chordId}-${hash}.${extension}`;
};

export const generateAudioKey = (songId: number, extension: string = 'mp3') => {
    const hash = crypto.randomBytes(16).toString('hex');
    return `music/${songId}-${hash}.${extension}`;
};

export async function uploadFile(file: File, key: string): Promise<string> {
    const buffer = Buffer.from(await file.arrayBuffer());
    const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: file.type,
        CacheControl: 'public, max-age=31536000',
    });
    await s3Client.send(command);
    return `${R2_PUBLIC_URL}/${key}`;
}

export const uploadImage = uploadFile;

export async function deleteFile(key: string) {
    const command = new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
    });
    await s3Client.send(command);
}

export const deleteImage = deleteFile;

// Opcional: generar URL firmada para imágenes privadas
export async function getSignedImageUrl(key: string, expiresIn: number = 3600) {
    const { GetObjectCommand } = await import('@aws-sdk/client-s3');
    const command = new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
    });
    return await getSignedUrl(s3Client, command, { expiresIn });
}

// Generar URL firmada para subidas directas desde el cliente
export async function getSignedUploadUrl(key: string, contentType: string, expiresIn: number = 3600) {
    const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000',
    });
    return await getSignedUrl(s3Client, command, { expiresIn });
}