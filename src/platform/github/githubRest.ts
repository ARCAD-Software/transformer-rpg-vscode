import axios from "axios";
import fs from "fs";
import stream from 'stream';
import tmp from "tmp";
import { promisify } from "util";

export namespace GitHubREST {
  function createClient(download?: boolean) {
    return axios.create({
      headers: {
        Accept: download ? "application/octet-stream" : "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28"
      },
      baseURL: "https://api.github.com"
    });
  }

  type Release = {
    id: string
    html_url: string
    tag_name: string
    name: string
    draft: boolean
    prerelease: boolean
    assets: Asset[]
  };

  type Asset = {
    id: string
    name: string
    label: string
    content_type: string
    url: string
    size: number
  };

  export async function getReleases() {
    return (await createClient().get<Release[]>("/repos/ARCAD-Software/transformer-rpg-vscode/releases")).data;
  }

  export async function downloadAsset(asset: Asset) {
    const finishedDownload = promisify(stream.finished);
    const tempFile = tmp.fileSync({ prefix: "tfrrpg", postfix: ".zip", discardDescriptor: true });
    const writer = fs.createWriteStream(tempFile.name);
    const response = await createClient(true).get(asset.url, { responseType: 'stream' });
    response.data.pipe(writer);
    await finishedDownload(writer);
    return tempFile;
  }
}