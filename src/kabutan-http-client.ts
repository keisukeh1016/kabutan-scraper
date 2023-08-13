// npm
import axios, { AxiosResponse } from "axios";

export class KabutanHttpClient {
  private code: string;

  public constructor(code: string) {
    this.code = code;
  }

  private getKabutanURL(): string {
    const url = `https://kabutan.jp/stock/?code=${this.code}`;
    return url;
  }

  private getKabutanFinanceURL(): string {
    const url = `https://kabutan.jp/stock/finance?code=${this.code}`;
    return url;
  }

  private async getAxiosResponse(
    url: string,
    count: number
  ): Promise<AxiosResponse<any, any> | null> {
    try {
      const response = await axios.get(url);
      return response;
    } catch (error: any) {
      if (error instanceof axios.AxiosError) {
        switch (error.response?.status.toString()[0]) {
          case "5":
            // サーバーエラーの場合、最大5回のリクエストを実行する
            if (count > 5) {
              return null;
            }
            await new Promise((resolve) =>
              setTimeout(resolve, count * 10 * 1000)
            );
            console.log(`リクエスト${count + 1}回目 "${url}"`);

            const response = await this.getAxiosResponse(url, count + 1);
            return response;
          default:
            return null;
        }
      }
      throw new Error(`Failed to get data: ${error.message}`);
    }
  }

  // HTTPレスポンスを取得
  public async getKabutanResponse(): Promise<AxiosResponse<any, any> | null> {
    const url = this.getKabutanURL();
    const response = await this.getAxiosResponse(url, 1);
    return response;
  }

  // HTTPレスポンスを取得
  public async getKabutanFinanceResponse(): Promise<AxiosResponse<
    any,
    any
  > | null> {
    const url = this.getKabutanFinanceURL();
    const response = await this.getAxiosResponse(url, 1);
    return response;
  }

  // HTMLを取得
  public async getKabutanHTML(): Promise<string> {
    const response = await this.getKabutanResponse();
    const html: string = response ? response.data : "";
    return html;
  }

  // HTMLを取得
  public async getKabutanFinanceHTML(): Promise<string> {
    const response = await this.getKabutanFinanceResponse();
    const html: string = response ? response.data : "";
    return html;
  }
}
