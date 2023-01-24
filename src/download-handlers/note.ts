import { writeFileSync } from 'fs';
import { join } from 'path';
import * as puppeteer from 'puppeteer';
import { outputPath } from '../cli';
import { createFolder } from '../helpers';
import { ItemWithPath } from '../types';

export async function noteDownloadHandler(file: ItemWithPath, browser: puppeteer.Browser, page: puppeteer.Page) {
    const newPage = await browser.newPage();

    // Fire off a request so we can listen for the "FileDownloadUrl"
    await newPage.goto(file.url);

    const text: string = await newPage.evaluate(() => {
        function mergeTextNodesWithPrefix(node, depth = 0) {
            let text = [];
            for (let i = 0; i < node.childNodes.length; i++) {
                let child = node.childNodes[i];
                if (child.nodeType === Node.TEXT_NODE) {
                    text.push("-".repeat(depth) + child.nodeValue);
                } else if (child.childNodes && child.tagName === "LI") {
                    text.push(mergeTextNodesWithPrefix(child, depth + 1));
                } else if (child.childNodes) {
                    text.push(mergeTextNodesWithPrefix(child, depth));
                }
            }
            return text.join('\n');
        }

        const content = document.getElementById('ctl00_ContentPlaceHolder_ContentContainer').children.item(2);
        return mergeTextNodesWithPrefix(content);
    });

    const toPath = join(outputPath, file.path.replace(/ /g, '_'), file.name);
    const dir = createFolder(toPath);
    writeFileSync(dir + file.name.replace(/"/g, '').replace(/ /g, '_') + '.txt', text);
}