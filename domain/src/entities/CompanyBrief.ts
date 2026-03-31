import { AggregateRoot } from '../AggregateRoot.js';
import { CompanyBriefId } from '../value-objects/CompanyBriefId.js';

export type CompanyBriefCreateProps = {
  companyId: string;
  productOverview: string;
  techStack: string;
  culture: string;
  recentNews: string;
  keyPeople: string;
};

export type CompanyBriefSections = {
  productOverview: string;
  techStack: string;
  culture: string;
  recentNews: string;
  keyPeople: string;
};

export class CompanyBrief extends AggregateRoot<CompanyBriefId> {
  public readonly companyId: string;
  public productOverview: string;
  public techStack: string;
  public culture: string;
  public recentNews: string;
  public keyPeople: string;
  public readonly createdAt: Date;
  public updatedAt: Date;

  public constructor(props: {
    id: CompanyBriefId;
    companyId: string;
    productOverview: string;
    techStack: string;
    culture: string;
    recentNews: string;
    keyPeople: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(props.id);
    this.companyId = props.companyId;
    this.productOverview = props.productOverview;
    this.techStack = props.techStack;
    this.culture = props.culture;
    this.recentNews = props.recentNews;
    this.keyPeople = props.keyPeople;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public refresh(sections: CompanyBriefSections): void {
    this.productOverview = sections.productOverview;
    this.techStack = sections.techStack;
    this.culture = sections.culture;
    this.recentNews = sections.recentNews;
    this.keyPeople = sections.keyPeople;
    this.updatedAt = new Date();
  }

  public static create(props: CompanyBriefCreateProps): CompanyBrief {
    const now = new Date();
    return new CompanyBrief({
      id: CompanyBriefId.generate(),
      companyId: props.companyId,
      productOverview: props.productOverview,
      techStack: props.techStack,
      culture: props.culture,
      recentNews: props.recentNews,
      keyPeople: props.keyPeople,
      createdAt: now,
      updatedAt: now
    });
  }
}
