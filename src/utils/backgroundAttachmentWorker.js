import cloudinary from "../config/cloudinary.js";
import {
  deleteFile,
  deleteFromCloudinary,
} from "../helper/cloudinaryHelper.js";

export const uploadFilesInBackground = async ({
  files,
  model,
  docId,
  field, // "attachments" OR "images"
  folder, // "sales" OR "products"
  isSingle = false, // true = single image, false = array
}) => {
  try {
    if (!files) return;
    if (!Array.isArray(files)) files = [files];

    const uploadPromises = files.map((file) =>
      cloudinary.uploader
        .upload(file.path, {
          folder,
          resource_type: "auto",
          timeout: 60000,
        })
        .then((uploaded) => {
          deleteFile(file.path);
          return uploaded.secure_url;
        })
    );

    const uploadedUrls = await Promise.all(uploadPromises);

    if (isSingle) {
      await model.findByIdAndUpdate(docId, {
        [field]: uploadedUrls[0],
      });
    } else {
      await model.findByIdAndUpdate(docId, {
        $push: { [field]: { $each: uploadedUrls } },
      });
    }
  } catch (err) {
    console.error("Background upload failed:", err.message);
  }
};

export const deleteFilesInBackground = async (urls = []) => {
  try {
    if (!urls.length) return;
    await Promise.all(urls.map((url) => deleteFromCloudinary(url)));
  } catch (err) {
    console.error("Background delete failed:", err.message);
  }
};
