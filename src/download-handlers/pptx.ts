import { ItemWithPath } from "../types";
import * as puppeteer from 'puppeteer';
import { createFolder, downloadFile } from "../helpers";
import { existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { outputPath } from "../cli";
import { waitAndMoveFile } from "../crutches";

export async function pptxDownloadHandler(file: ItemWithPath, browser: puppeteer.Browser, page: puppeteer.Page) {
  const newPage = await browser.newPage();

  // Fire off a request so we can listen for the "FileDownloadUrl"
  await newPage.goto(file.url);

  await newPage.waitForTimeout(1000);
  const frame = await newPage.waitForFrame((frame) => frame.name() == 'office_frame');

  await frame.waitForSelector("a[id='PptUpperToolbar.LeftButtonDock.DownloadWithPowerPoint-Medium20']");
  await frame.click("a[id='PptUpperToolbar.LeftButtonDock.DownloadWithPowerPoint-Medium20']");

  const downloadTab = await browser.waitForTarget(async target => target.url().startsWith('blob'));
  if (downloadTab) {
    const toPath = join(outputPath, file.path.replace(/ /g, '_'), file.name);
    const dir = createFolder(toPath);

    await waitAndMoveFile(file.name, dir);
    await newPage.close();
  }

}