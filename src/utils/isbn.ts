import type { IsbnLookupResult } from '@/types';

const mockBookDatabase: Record<string, Partial<IsbnLookupResult>> = {
  '9787020002207': {
    title: '红楼梦',
    author: '曹雪芹',
    publisher: '人民文学出版社',
    publishDate: '1996-12-01',
    description: '中国古典四大名著之首，以贾宝玉、林黛玉、薛宝钗的爱情婚姻悲剧为主线，展现了封建社会的全景图。',
    coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=400&fit=crop',
  },
  '9787544270878': {
    title: '活着',
    author: '余华',
    publisher: '南海出版公司',
    publishDate: '2012-08-01',
    description: '讲述了农村人福贵悲惨的人生遭遇。福贵本是个阔少爷，可他嗜赌如命，终于赌光了家业。',
    coverImage: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300&h=400&fit=crop',
  },
  '9787532754688': {
    title: '百年孤独',
    author: '加西亚·马尔克斯',
    publisher: '上海译文出版社',
    publishDate: '2011-06-01',
    description: '魔幻现实主义文学的代表作，描写了布恩迪亚家族七代人的传奇故事。',
    coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=400&fit=crop',
  },
  '9787530211701': {
    title: '平凡的世界',
    author: '路遥',
    publisher: '北京十月文艺出版社',
    publishDate: '2012-03-01',
    description: '以中国70年代中期到80年代中期十年间为背景，以孙少安和孙少平两兄弟为中心，展示了普通人在大时代历史进程中所走过的艰难曲折的道路。',
    coverImage: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=300&h=400&fit=crop',
  },
  '9787020024759': {
    title: '围城',
    author: '钱钟书',
    publisher: '人民文学出版社',
    publishDate: '1991-02-01',
    description: '以讽刺的笔调描写了抗战初期知识分子群相，是中国现代文学史上一部风格独特的讽刺小说。',
    coverImage: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=300&h=400&fit=crop',
  },
  '9787544253994': {
    title: '白夜行',
    author: '东野圭吾',
    publisher: '南海出版公司',
    publishDate: '2008-09-01',
    description: '日本推理小说天王东野圭吾的代表作，故事围绕着一对有着不同寻常情愫的小学生展开。',
    coverImage: 'https://images.unsplash.com/photo-1509266272358-7701da638078?w=300&h=400&fit=crop',
  },
  '9787532742489': {
    title: '挪威的森林',
    author: '村上春树',
    publisher: '上海译文出版社',
    publishDate: '2001-02-01',
    description: '日本作家村上春树的一部长篇爱情小说，故事讲述主角纠缠在情绪不稳定且患有精神疾病的直子和开朗活泼的小林绿子之间。',
    coverImage: 'https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=300&h=400&fit=crop',
  },
  '9787020042180': {
    title: '白鹿原',
    author: '陈忠实',
    publisher: '人民文学出版社',
    publishDate: '1993-06-01',
    description: '以陕西关中平原上素有"仁义村"之称的白鹿村为背景，细腻地反映出白姓和鹿姓两大家族祖孙三代的恩怨纷争。',
    coverImage: 'https://images.unsplash.com/photo-1524578271613-d550eacf6090?w=300&h=400&fit=crop',
  },
};

export async function lookupIsbn(isbn: string): Promise<IsbnLookupResult | null> {
  await new Promise(resolve => setTimeout(resolve, 500));

  const cleanIsbn = isbn.replace(/[-\s]/g, '');

  if (mockBookDatabase[cleanIsbn]) {
    const book = mockBookDatabase[cleanIsbn];
    return {
      isbn: cleanIsbn,
      title: book.title || '',
      author: book.author || '',
      publisher: book.publisher || '',
      publishDate: book.publishDate || '',
      coverImage: book.coverImage || '',
      description: book.description || '',
    };
  }

  if (cleanIsbn.length === 13 && cleanIsbn.startsWith('978')) {
    return {
      isbn: cleanIsbn,
      title: `未知书籍 (${cleanIsbn.slice(-4)})`,
      author: '未知作者',
      publisher: '未知出版社',
      publishDate: '',
      coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=400&fit=crop',
      description: '暂无书籍简介，请手动补充信息。',
    };
  }

  return null;
}

export function validateIsbn(isbn: string): boolean {
  const cleanIsbn = isbn.replace(/[-\s]/g, '');
  return /^\d{10}$|^\d{13}$/.test(cleanIsbn);
}
