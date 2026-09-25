export interface FeaturedQuote {
  text: string;
  attribution: string;
  attributionStatus: 'verified' | 'attributed';
  provenance: {
    sourceTitle: string;
    publisher: string;
    sourceUrl: string;
    note: string;
  };
}

export interface FeaturedScientist {
  id: string;
  name: string;
  field: string;
  quote: FeaturedQuote;
}

// V1 is intentionally static. This shape can later support a scientist profile,
// a curated quote collection, or deterministic daily selection without changing
// the landing-page presentation contract.
export const featuredScientist: FeaturedScientist = {
  id: 'albert-einstein',
  name: 'Albert Einstein',
  field: 'Theoretical physics',
  quote: {
    text: 'If at first the idea is not absurd, then there is no hope for it.',
    attribution: 'Attributed to Albert Einstein',
    attributionStatus: 'attributed',
    provenance: {
      sourceTitle: 'Quotations by Albert Einstein',
      publisher: 'MacTutor History of Mathematics, University of St Andrews',
      sourceUrl: 'https://mathshistory.st-andrews.ac.uk/Biographies/Einstein/quotations/',
      note: 'MacTutor includes the wording and cites Des MacHale, Wisdom (2002). No primary Einstein document is asserted, so the site labels the quotation as attributed.',
    },
  },
};
