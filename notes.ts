// Open all folders
function openAllFolders() {
  const closedFolders = [...document.querySelectorAll('li.folder.jstree-closed')];
  if (closedFolders.length > 0) {
    closedFolders.forEach(f => (f.children[0] as any).click());
    setTimeout(openAllFolders, 400);
  }
}

interface Folder {
  name: string;
  files: Item[];
  subfolders: Folder[];
}

type ItemTypes = 'note' | 'pdf' | 'document' | 'link' | 'assignment' | 'word' | 'powerpoint' | 'survey' | 'activity' | 'mp4';
interface Item {
  name: string;
  url: string;
  type: ItemTypes | 'unknown';
}

const typeIdentifiers: { [key: string]: ItemTypes | undefined } = {
  'https://platform.itslearning.com/Handlers/ExtensionIconHandler.ashx?ExtensionId=5009&IconFormat=Default&IconSize=0&IconsVersion=128&IconTypeId=13&UseDoubleResolutionIconSizeIfAvailable=False&UseMonochromeIconAsDefault=False': 'mp4',
  'https://cdn.itslearning.com/v3.128.6.630/icons/xp/element_note16.png': 'note',
  'https://cdn.itslearning.com/v3.128.6.630/icons/xp/element_file16.png': 'document',
  'https://cdn.itslearning.com/v3.128.6.630/icons/xp/element_customactivity16.png': 'activity',
  'https://platform.itslearning.com/Handlers/ExtensionIconHandler.ashx?ExtensionId=5009&IconFormat=Default&IconSize=0&IconsVersion=128&IconTypeId=12&UseDoubleResolutionIconSizeIfAvailable=False&UseMonochromeIconAsDefault=False': 'pdf',
  'https://platform.itslearning.com/Handlers/ExtensionIconHandler.ashx?ExtensionId=5009&IconFormat=Default&IconSize=0&IconsVersion=128&UseDoubleResolutionIconSizeIfAvailable=False&UseMonochromeIconAsDefault=False': 'document',
  'https://platform.itslearning.com/Handlers/ExtensionIconHandler.ashx?ExtensionId=5010&IconFormat=Default&IconSize=0&IconsVersion=2&UseDoubleResolutionIconSizeIfAvailable=False&UseMonochromeIconAsDefault=False': 'link',
  'https://platform.itslearning.com/Handlers/ExtensionIconHandler.ashx?ExtensionId=5006&IconFormat=Default&IconSize=0&IconsVersion=1&UseDoubleResolutionIconSizeIfAvailable=False&UseMonochromeIconAsDefault=False': 'assignment',
  'https://cdn.itslearning.com/v3.128.6.630/icons/xp/element_survey16.png': 'survey',
  'https://platform.itslearning.com/Handlers/ExtensionIconHandler.ashx?ExtensionId=5009&IconFormat=Default&IconSize=0&IconsVersion=128&IconTypeId=1&UseDoubleResolutionIconSizeIfAvailable=False&UseMonochromeIconAsDefault=False': 'word',
  'https://platform.itslearning.com/Handlers/ExtensionIconHandler.ashx?ExtensionId=5009&IconFormat=Default&IconSize=0&IconsVersion=128&IconTypeId=3&UseDoubleResolutionIconSizeIfAvailable=False&UseMonochromeIconAsDefault=False': 'powerpoint',
}

// Traverse folders
function traverseFolder(li: HTMLLIElement): Folder {
  const aNode = li.children[1] as HTMLAnchorElement;
  const name = aNode.innerText;
  const id = li.id;
  const childrenFolders = [...li.querySelectorAll<HTMLLIElement>(`#${id} > ul > li.folder`)];
  const childrenItems = [...li.querySelectorAll<HTMLLIElement>(`#${id} > ul > li:not(.folder)`)];

  return {
    name,
    files: childrenItems.map(item => ({
      name: (item.children[1] as HTMLAnchorElement).innerText,
      url: (item.children[1] as HTMLAnchorElement).href,
      type: typeIdentifiers[((item.children[1] as HTMLAnchorElement).children[1] as HTMLImageElement).src] || 'unknown',
    })),
    subfolders: childrenFolders.map(folder => traverseFolder(folder)),
  }
}

function traverseRoot(): Folder {
  const root = document.querySelector<HTMLLIElement>('#ctl00_TreeMenu_TreeMenu_C > ul > li');
  if(!root) throw new Error('Can\'t find root');
  return traverseFolder(root);
}