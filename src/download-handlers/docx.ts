import { ItemWithPath } from "../types";
import * as puppeteer from 'puppeteer';
import { existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { outputPath } from "../cli";
import { waitAndMoveFile } from "../crutches";
import { createFolder } from "../helpers";

export async function docxDownloadHandler(file: ItemWithPath, browser: puppeteer.Browser, page: puppeteer.Page) {
  const newPage = await browser.newPage();

  // Fire off a request so we can listen for the "FileDownloadUrl"
  await newPage.goto(file.url);

  await newPage.waitForTimeout(1000);
  const frame = await newPage.waitForFrame((frame) => frame.name() == 'office_frame');

  await frame.waitForSelector('i[data-icon-name="DownloadAttachment_16"]');
  await frame.click('i[data-icon-name="DownloadAttachment_16"]');

  const downloadTab = await browser.waitForTarget(async target => target.url().startsWith('blob'));
  if (downloadTab) {
    const toPath = join(outputPath, file.path.replace(/ /g, '_'), file.name);
    const dir = createFolder(toPath);

    await waitAndMoveFile(file.name, dir);
    await newPage.close();
  }

}