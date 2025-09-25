// Cloudinary upload utility for ShareSpace
import axios from 'axios';

const CLOUDINARY_UPLOAD_URL = 'https://api.cloudinary.com/v1_1/dpgcim0sj/image/upload';
const CLOUDINARY_UPLOAD_PRESET = 'sharespace';

export async function uploadImageToCloudinary(file: File): Promise<string> {
  if (!(file instanceof File) || file.size === 0 || !file.type.startsWith('image/')) {
    throw new Error('Invalid file: must be a non-empty image file.');
  }
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  // Remove Authorization header for this request if set globally
  const originalAuth = axios.defaults.headers.common['Authorization'];
  delete axios.defaults.headers.common['Authorization'];
  try {
    const response = await axios.post(CLOUDINARY_UPLOAD_URL, formData);
    return response.data.secure_url;
  } finally {
    // Restore Authorization header after upload
    if (originalAuth) {
      axios.defaults.headers.common['Authorization'] = originalAuth;
    }
  }
}
