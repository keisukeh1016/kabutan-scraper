// npm
import { AxiosResponse } from "axios";

// src
import { AxiosWrapper } from "../axios-wrapper/axios-wrapper";

export class KabutanTopHttpClient {
  private code: string;

  public constructor(code: string) {
    this.code = code;
  }

  // URLを作成
  private getUrl(): string {
    const url = `https://kabutan.jp/stock/?code=${this.code}`;
    return url;
  }

  // HTTPレスポンスを取得
  public async getHttpResponse(): Promise<AxiosResponse<any, any> | null> {
    const url = this.getUrl();
    const response = await AxiosWrapper.getHttpResponse(url, 1);
    return response;
  }

  // HTMLを取得
  public async getHtml(): Promise<string> {
    const url = this.getUrl();
    const html = await AxiosWrapper.getHtml(url);
    return html;
  }
}
