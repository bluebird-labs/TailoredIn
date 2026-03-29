import * as HtmlParser from 'node-html-parser';
import { NodeType } from 'node-html-parser';
import type { Job } from './entities/jobs/Job.js';

export enum JobDescriptionItemRole {
  TITLE = 'title',
  TEXT = 'text',
  LIST = 'list',
  BR = 'br'
}

export type JobDescriptionTitleItem = {
  role: JobDescriptionItemRole.TITLE;
  text: string;
};

export type JobDescriptionTextItem = {
  role: JobDescriptionItemRole.TEXT;
  text: string;
};

export type JobDescriptionListItem = {
  role: JobDescriptionItemRole.LIST;
  text: string[];
};

export type JobDescriptionBrItem = {
  role: JobDescriptionItemRole.BR;
  text: '\n';
};

export type JobDescriptionItem =
  | JobDescriptionTextItem
  | JobDescriptionTitleItem
  | JobDescriptionListItem
  | JobDescriptionBrItem;

export abstract class JobDescriptionItemsExtractor {
  public static extractItemsFromJob(job: Job): JobDescriptionItem[] {
    const paragraph = HtmlParser.parse(job.descriptionHtml).firstChild;

    if (!paragraph) {
      throw new Error(`Job ${job.id} description does not start with a paragraph tag.`);
    }

    const jobDescriptionItems: JobDescriptionItem[] = [];

    const traverse = (node: HtmlParser.Node, items: JobDescriptionItem[]): any => {
      if (node.nodeType === NodeType.COMMENT_NODE || node.rawTagName === 'em') {
        return;
      }

      if (node.nodeType === NodeType.TEXT_NODE || node.rawTagName === 'a') {
        JobDescriptionItemsExtractor.whenNodeHasText(node, text => {
          if (items.length === 0 || items[items.length - 1].role !== JobDescriptionItemRole.TEXT) {
            items.push({
              role: JobDescriptionItemRole.TEXT,
              text: text
            });
          } else {
            items[items.length - 1].text += ` ${text}`;
          }
        });

        return;
      }

      if (node.rawTagName === 'br') {
        if (items.length > 0 && items[items.length - 1].role !== JobDescriptionItemRole.BR) {
          items.push({
            role: JobDescriptionItemRole.BR,
            text: '\n'
          });
        }

        return;
      }

      if (node.rawTagName === 'strong') {
        JobDescriptionItemsExtractor.whenNodeHasText(node, text => {
          if (items.length === 0 || items[items.length - 1].role !== JobDescriptionItemRole.TEXT) {
            items.push({
              role: JobDescriptionItemRole.TITLE,
              text: text
            });
          } else {
            items[items.length - 1].text += ` ${text}`;
          }
        });

        return;
      }

      if (node.rawTagName === 'ul') {
        const bullets: string[] = [];

        for (const childNode of node.childNodes) {
          JobDescriptionItemsExtractor.whenNodeHasText(childNode, text => bullets.push(text));
        }

        items.push({
          role: JobDescriptionItemRole.LIST,
          text: bullets
        });

        return;
      }

      if (node.rawTagName === 'span' && node.childNodes.length === 1) {
        traverse(node.childNodes[0], items);

        return;
      }

      for (const childNode of node.childNodes) {
        traverse(childNode, items);
      }
    };

    traverse(paragraph, jobDescriptionItems);

    return jobDescriptionItems;
  }

  private static whenNodeHasText(node: HtmlParser.Node, delegate: (text: string) => void) {
    const text = JobDescriptionItemsExtractor.parseText(node);

    if (text !== null) {
      delegate(text);
    }
  }

  private static parseText(node: HtmlParser.Node): string | null {
    const text = node.text.trim();

    if (text !== '') {
      return text;
    }

    return null;
  }
}
