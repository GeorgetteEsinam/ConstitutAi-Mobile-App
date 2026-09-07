import rawConstitution from './constitution.json';

const chapterDefinitions = [
  ['The Constitution', 1, 3],
  ['Territories of Ghana', 4, 5],
  ['Citizenship', 6, 10],
  ['The Laws of Ghana', 11, 11],
  ['Fundamental Human Rights and Freedoms', 12, 33],
  ['The Directive Principles of State Policy', 34, 41],
  ['Representation of the People', 42, 56],
  ['The Executive', 57, 88],
  ['The Council of State', 89, 92],
  ['The Legislature', 93, 124],
  ['The Judiciary', 125, 161],
  ['Freedom and Independence of the Media', 162, 173],
  ['Finance', 174, 189],
  ['The Public Services', 190, 199],
  ['The Police Service', 200, 204],
  ['The Prisons Service', 205, 209],
  ['The Armed Forces of Ghana', 210, 215],
  ['Commission on Human Rights and Administrative Justice', 216, 230],
  ['National Commission for Civic Education', 231, 239],
  ['Decentralization and Local Government', 240, 256],
  ['Lands and Natural Resources', 257, 269],
  ['Chieftaincy', 270, 277],
  ['Commissions of Inquiry', 278, 283],
  ['Code of Conduct for Public Officers', 284, 288],
  ['Amendment of the Constitution', 289, 292],
  ['Miscellaneous', 293, 299],
];

const allArticles = rawConstitution.chapters.flatMap((chapter) => chapter.articles);
const article34 = {
  id: '34',
  number: 34,
  title: 'Implementation of Directive Principles',
  text: '(1) The Directive Principles of State Policy contained in this Chapter shall guide all citizens, Parliament, the President, the Judiciary, the Council of State, the Cabinet, political parties and other bodies and persons in applying or interpreting this Constitution or any other law and in taking and implementing any policy decisions, for the establishment of a just and free society.\n\n(2) The President shall report to Parliament at least once a year all the steps taken to ensure the realization of the policy objectives contained in this Chapter; and, in particular, the realization of basic human rights, a healthy economy, the right to work, the right to good health care and the right to education.',
};

const articlesByNumber = new Map(allArticles.map((article) => [article.number, article]));
articlesByNumber.set(34, article34);

export const constitutionData = {
  chapters: chapterDefinitions.map(([title, firstArticle, lastArticle], index) => ({
    id: String(index + 1),
    number: index + 1,
    title,
    articles: Array.from({ length: lastArticle - firstArticle + 1 }, (_, offset) =>
      articlesByNumber.get(firstArticle + offset)
    ).filter(Boolean),
  })),
};

export default constitutionData;
