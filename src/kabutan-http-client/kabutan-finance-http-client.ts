// src
import { AxiosWrapper } from "../axios-wrapper/axios-wrapper";

export class KabutanFinanceHttpClient {
  private code: string;

  public constructor(code: string) {
    this.code = code;
  }

  // URLを作成
  private getUrl(): string {
    const url = `https://kabutan.jp/stock/finance?code=${this.code}`;
    return url;
  }

  // HTMLを取得
  public async getHtml(): Promise<string> {
    const url = this.getUrl();
    const html = await AxiosWrapper.getHtml(url);
    return html;
  }
}
