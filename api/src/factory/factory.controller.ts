import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PDFParse } from 'pdf-parse';
@Controller('factory')
export class FactoryController {
  @Post('extract-text')
  @UseInterceptors(FileInterceptor('file'))
  public async extractText(@UploadedFile() file: { originalname: string; buffer: Buffer }) {
    const name = file.originalname.toLowerCase();

    let text: string;
    if (name.endsWith('.pdf')) {
      const parser = new PDFParse({ data: new Uint8Array(file.buffer) });
      const result = await parser.getText();
      text = result.text;
      await parser.destroy();
    } else {
      text = file.buffer.toString('utf-8');
    }

    return { data: { text: text.trim() } };
  }
}
