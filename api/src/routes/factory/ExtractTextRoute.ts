import { injectable } from '@needle-di/core';
import { Elysia, t } from 'elysia';
import { PDFParse } from 'pdf-parse';

@injectable()
export class ExtractTextRoute {
  public plugin() {
    return new Elysia().post(
      '/factory/extract-text',
      async ({ body }) => {
        const file = body.file as File;
        const buffer = Buffer.from(await file.arrayBuffer());
        const name = file.name.toLowerCase();

        let text: string;
        if (name.endsWith('.pdf')) {
          const parser = new PDFParse({ data: new Uint8Array(buffer) });
          const result = await parser.getText();
          text = result.text;
          await parser.destroy();
        } else {
          // Plain text fallback for .txt files
          text = buffer.toString('utf-8');
        }

        return { data: { text: text.trim() } };
      },
      {
        body: t.Object({ file: t.File() })
      }
    );
  }
}
