import { existsSync, readdirSync, renameSync } from "fs";
import { join } from "path";
import { DOWNLOAD_PATH } from "./cli";

export async function waitAndMoveFile(fileName: string, outputPath: string) {
  try {
    while (!readdirSync(DOWNLOAD_PATH).find(file => file.includes(fileName))) {
      // wait for the file to appear in the download folder
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const correctFileName = readdirSync(DOWNLOAD_PATH).find(file => file.includes(fileName));
    const downloadPath = join(DOWNLOAD_PATH, correctFileName);
    renameSync(downloadPath, join(outputPath, correctFileName));
  } catch (error) {
    console.log('Error moving file');
    console.error(error);
  }
}