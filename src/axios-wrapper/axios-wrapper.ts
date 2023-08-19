// npm
import axios, { AxiosResponse } from "axios";

export class AxiosWrapper {
  // HTTPレスポンスを取得
  public static async getHttpResponse(
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

            const response = await this.getHttpResponse(url, count + 1);
            return response;
          default:
            return null;
        }
      }
      throw new Error(`Failed to get data: ${error.message}`);
    }
  }

  // HTMLを取得
  public static async getHtml(url: string): Promise<string> {
    const response = await AxiosWrapper.getHttpResponse(url, 1);
    const html: string = response ? response.data : "";
    return html;
  }
}
