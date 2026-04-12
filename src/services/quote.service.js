import { Quote } from "../models/Quote.model.js";
import { Readable } from "stream";
import csv from "csv-parser";
import fs from "fs";
import { mapRowToQuote } from "../utils/mapRowToQuote.js";
function convertGoogleSheetUrlToExport(url) {
    if (!url) return null;
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) return null;
    return `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv`;
}

export const getAll = async ({ page = 1, limit = 10, search = "", status }) => {
  const query = {};

  if (search) {
    query.$or = [
      { clientName: { $regex: search, $options: "i" } },
      { product: { $regex: search, $options: "i" } },
    ];
  }
  if (status) {
    query.status = status;
  }
  const skip = (Number(page) - 1) * Number(limit);
  const [quotes, totalCount] = await Promise.all([
    Quote.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Quote.countDocuments(query),
  ]);

  const totalPages = Math.ceil(totalCount / Number(limit));

  return {
    content: quotes,
    totalCount,
    totalPages,
    currentPage: Number(page),
  };
};

export const getById = async (id) => {
  return Quote.findById(id);
};

export const create = async (data) => {
  return Quote.create(data);
};

export const update = async (id, data) => {
  return Quote.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

export const remove = async (id) => {
  return Quote.findByIdAndDelete(id);
};

export const updateStatus = async (trackId, status) => {
  const track = await Quote.findById(trackId);
  if (!track) throw new Error("Quote Track not found");
  track.status = status;
  await track.save();
  return track;
};

const processStream = async (stream, { user }) => {
  const parsedRows = [];
  await new Promise((resolve, reject) => {
    stream.pipe(csv()).on("data", (row) => parsedRows.push(row)).on("end", resolve).on("error", reject);
  });

  let insertedCount = 0;
  for (const row of parsedRows) {
    const mapped = await mapRowToQuote(row);
    if (!mapped.errorData) {
        await Quote.create({ ...mapped, createdBy: user?.id });
        insertedCount++;
    }
  }
  return { insertedCount, totalProcessed: parsedRows.length };
};

export const importFromGoogleSheet = async (url, user) => {
  const exportUrl = convertGoogleSheetUrlToExport(url);
  const res = await fetch(exportUrl);
  const stream = Readable.fromWeb(res.body);
  return await processStream(stream, { user });
};

export const importFromCsvFile = async (file, user) => {
  const stream = file.buffer ? Readable.from(file.buffer) : fs.createReadStream(file.path);
  return await processStream(stream, { user });
};
