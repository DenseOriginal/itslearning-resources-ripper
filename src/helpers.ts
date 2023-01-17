import { createWriteStream, existsSync, mkdirSync } from "fs";
import { Folder, Item, ItemTypes, ItemWithPath } from "./types";
import axios from "axios";
import { dirname } from "path";

export const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Open all folders
export function openAllFolders() {
  const closedFolders = [];
  document.querySelectorAll('li.folder.jstree-closed').forEach(i => closedFolders.push(i));

  if (closedFolders.length > 0) {
    closedFolders.forEach(f => (f.children[0] as any).click());
    setTimeout(openAllFolders, 400);
  }
}

// Traverse folders
export function traverseFolder(li: HTMLLIElement | undefined): Folder {
  // Setup stuff
  const querySelectorAll = <T extends HTMLElement>(query: string, elm: HTMLElement | Document): T[] => {
    const elms = [];
    elm.querySelectorAll(query).forEach(i => elms.push(i));
    return elms;
  }

  const regexIndentifiers: [RegExp, ItemTypes][] = [
    [/https:\/\/cdn\.itslearning\.com\/v3\.\d{3}\.\d\.\d{3}\/icons\/xp\/element_file16\.png/g, 'document'],
    [/https:\/\/cdn\.itslearning\.com\/v3\.\d{3}\.\d\.\d{3}\/icons\/xp\/element_note16\.png/g, 'note'],
    [/https:\/\/cdn\.itslearning\.com\/v3\.\d{3}\.\d\.\d{3}\/icons\/xp\/element_survey16\.png/g, 'survey'],
    [/https:\/\/cdn\.itslearning\.com\/v3\.\d{3}\.\d\.\d{3}\/icons\/xp\/element_customactivity16\.png/g, 'activity'],
    [/https:\/\/platform\.itslearning\.com\/Handlers\/ExtensionIconHandler.ashx\?ExtensionId=5009&IconFormat=Default&IconSize=0&IconsVersion=\d{3}&IconTypeId=3&UseDoubleResolutionIconSizeIfAvailable=False&UseMonochromeIconAsDefault=False/g, 'powerpoint'],
    [/https:\/\/platform\.itslearning\.com\/Handlers\/ExtensionIconHandler.ashx\?ExtensionId=5009&IconFormat=Default&IconSize=0&IconsVersion=\d{3}&IconTypeId=1&UseDoubleResolutionIconSizeIfAvailable=False&UseMonochromeIconAsDefault=False/g, 'word'],
    [/https:\/\/platform\.itslearning\.com\/Handlers\/ExtensionIconHandler.ashx\?ExtensionId=5009&IconFormat=Default&IconSize=0&IconsVersion=\d{3}&UseDoubleResolutionIconSizeIfAvailable=False&UseMonochromeIconAsDefault=False/g, 'document'],
    [/https:\/\/platform\.itslearning\.com\/Handlers\/ExtensionIconHandler.ashx\?ExtensionId=5009&IconFormat=Default&IconSize=0&IconsVersion=\d{3}&IconTypeId=12&UseDoubleResolutionIconSizeIfAvailable=False&UseMonochromeIconAsDefault=False/g, 'pdf'],
    [/https:\/\/platform\.itslearning\.com\/Handlers\/ExtensionIconHandler.ashx\?ExtensionId=5009&IconFormat=Default&IconSize=0&IconsVersion=\d{3}&IconTypeId=13&UseDoubleResolutionIconSizeIfAvailable=False&UseMonochromeIconAsDefault=False/g, 'mp4'],
    [/https:\/\/platform\.itslearning\.com\/Handlers\/ExtensionIconHandler.ashx\?ExtensionId=5010&IconFormat=Default&IconSize=0&IconsVersion=\d&UseDoubleResolutionIconSizeIfAvailable=False&UseMonochromeIconAsDefault=False/g, 'link'],
    [/https:\/\/platform\.itslearning\.com\/Handlers\/ExtensionIconHandler.ashx\?ExtensionId=5006&IconFormat=Default&IconSize=0&IconsVersion=\d&UseDoubleResolutionIconSizeIfAvailable=False&UseMonochromeIconAsDefault=False/g, 'assignment'],
  ];

  // Start

  if (!li) li = document.querySelector<HTMLLIElement>('#ctl00_TreeMenu_TreeMenu_C > ul > li');

  const aNode = li.children[1] as HTMLAnchorElement;
  const name = aNode.innerText;
  const id = li.id;
  const childrenFolders = querySelectorAll<HTMLLIElement>(`#${id} > ul > li.folder`, li);
  const childrenItems = querySelectorAll<HTMLLIElement>(`#${id} > ul > li:not(.folder)`, li);

  const folder: Folder = {
    name,
    files: childrenItems.map(item => ({
      name: (item.children[1] as HTMLAnchorElement).innerText,
      url: (item.children[1] as HTMLAnchorElement).href,
      type: regexIndentifiers.find(([regex]) => regex.test(((item.children[1] as HTMLAnchorElement).children[1] as HTMLImageElement).src))?.[1] || 'unknown',
    })),
    subfolders: childrenFolders.map(folder => traverseFolder(folder)),
  };
  console.log(folder);

  return folder;
}

export function flattenFolders(folder: Folder, path: string): ItemWithPath[] {
  const files = folder.files.map(cur => ({ ...cur, path }));
  const subFiles = folder.subfolders.reduce((acc, cur) => [...acc, ...flattenFolders(cur, path + '/' + cur.name)], []);
  return [...files, ...subFiles];
}

export async function downloadFile(fileUrl: string, outputLocationPath: string, cookies: string) {
  const writer = createWriteStream(outputLocationPath);

  return axios.get(fileUrl, {
    method: 'get',
    url: fileUrl,
    responseType: 'stream',
    headers: {
      'cookie': cookies,
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
    }
  }).then(response => {

    //ensure that the user can call `then()` only when the file has
    //been downloaded entirely.

    return new Promise((resolve, reject) => {
      response.data.pipe(writer);
      let error = null;
      writer.on('error', err => {
        error = err;
        writer.close();
        reject(err);
      });
      writer.on('close', () => {
        if (!error) {
          resolve(true);
        }
        //no need to call the reject here, as it will have been called in the
        //'error' stream;
      });
    });
  });
}

export function updateLogLine(line: number, newText: string) {
  process.stdout.moveCursor(0, -line);
  process.stdout.clearLine(0);
  console.log(newText);
  process.stdout.moveCursor(0, line);
}

// Capitalize first letter of each word
export function capitalize(str: string) {
  return str.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

export function createFolder(path: string) {
  const dir = dirname(path.replace(/[^C]:/g, ' ').replace(/é/g, 'e'));

  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  return dir;
}

export function sanitizePath(path: string): string {
  return path.replace(/[^C]:/g, ' ').replace(/é/g, 'e');
}