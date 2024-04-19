import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Express } from 'express';
import { json, urlencoded } from 'body-parser';
import * as multer from 'multer';
import { stringify } from 'csv-stringify';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(json());
  app.use(urlencoded({ extended: true }));
  app.use(multer().single('file'));

  app.post('/convert', (req, res) => {
    const srtData = req.file.buffer.toString();
    const srtRows = srtData.split('\n\n');
    const csvData = [];

    srtRows.forEach((row) => {
      const [index, timestampRange, ...contentParts] = row.split('\n');
      const [startTime, endTime] = timestampRange.split(' --> ');
      const [speaker, ...contentArr] = contentParts.join(' ').split(':');
      const content = contentArr.join(':').trim();
      csvData.push([index, `${startTime} --> ${endTime}`, speaker, content]);
    });

    stringify(csvData, (err, output) => {
      if (err) {
        console.error(err);
        res.status(500).send('Error converting SRT to CSV');
      } else {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="output.csv"');
        res.status(200).send(output);
      }
    });
  });

  await app.listen(3000);
}
bootstrap();