export interface LocaleMessages {
  common: {
    all: string;
    copyToClipboard: string;
  };
  navigation: {
    openMainMenu: string;
  };
  theme: {
    system: string;
    light: string;
    dark: string;
    currentTheme: string;
    cycleTheme: string;
  };
  profile: {
    email: string;
    location: string;
    workAddress: string;
    click: string;
    googleMap: string;
    send: string;
    sendEmail: string;
    education: string;
    gpa: string;
    supervisor: string;
    supervisors: string;
    researchInterests: string;
  };
  home: {
    about: string;
    news: string;
    selectedPublications: string;
    viewAll: string;
  };
  publications: {
    searchPlaceholder: string;
    filters: string;
    year: string;
    fromYear: string;
    toYear: string;
    type: string;
    sortBy: string;
    noResults: string;
    abstract: string;
    expandAbstract: string;
    collapseAbstract: string;
    originalPaper: string;
    bibtex: string;
    code: string;
    correspondingAuthor: string;
  };
  footer: {
    lastUpdated: string;
    builtWithPrism: string;
    refinedBy: string;
  };
}

const en: LocaleMessages = {
  common: {
    all: 'All',
    copyToClipboard: 'Copy to clipboard',
  },
  navigation: {
    openMainMenu: 'Open main menu',
  },
  theme: {
    system: 'System',
    light: 'Light',
    dark: 'Dark',
    currentTheme: 'Current theme',
    cycleTheme: 'Click to cycle theme',
  },
  profile: {
    email: 'Email',
    location: 'Location',
    workAddress: 'Work Address',
    click: 'Click',
    googleMap: 'Google Map',
    send: 'Send',
    sendEmail: 'Send Email',
    education: 'Education',
    gpa: 'GPA',
    supervisor: 'Supervisor',
    supervisors: 'Supervisors',
    researchInterests: 'Research Interests',
  },
  home: {
    about: 'About',
    news: 'News',
    selectedPublications: 'Selected Publications',
    viewAll: 'View All',
  },
  publications: {
    searchPlaceholder: 'Search publications...',
    filters: 'Filters',
    year: 'Year',
    fromYear: 'From',
    toYear: 'To',
    type: 'Type',
    sortBy: 'Sort by',
    noResults: 'No publications found matching your criteria.',
    abstract: 'Abstract',
    expandAbstract: 'Expand abstract',
    collapseAbstract: 'Collapse abstract',
    originalPaper: 'Original Paper',
    bibtex: 'BibTeX',
    code: 'Code',
    correspondingAuthor: '* Corresponding author',
  },
  footer: {
    lastUpdated: 'Last updated',
    builtWithPrism: 'Built with PRISM',
    refinedBy: 'Refined by Kian Yan',
  },
};

const zh: LocaleMessages = {
  common: {
    all: '全部',
    copyToClipboard: '复制到剪贴板',
  },
  navigation: {
    openMainMenu: '打开主菜单',
  },
  theme: {
    system: '跟随系统',
    light: '浅色',
    dark: '深色',
    currentTheme: '当前主题',
    cycleTheme: '点击切换主题',
  },
  profile: {
    email: '邮箱',
    location: '地址',
    workAddress: '办公地址',
    click: '点击',
    googleMap: '谷歌地图',
    send: '发送',
    sendEmail: '发送邮件',
    education: '教育经历',
    gpa: 'GPA',
    supervisor: '导师',
    supervisors: '导师',
    researchInterests: '研究兴趣',
  },
  home: {
    about: '关于我',
    news: '动态',
    selectedPublications: '精选论文',
    viewAll: '查看全部',
  },
  publications: {
    searchPlaceholder: '搜索论文...',
    filters: '筛选',
    year: '年份',
    fromYear: '起始年份',
    toYear: '结束年份',
    type: '类型',
    sortBy: '排序方式',
    noResults: '没有找到符合条件的论文。',
    abstract: '摘要',
    expandAbstract: '展开摘要',
    collapseAbstract: '收起摘要',
    originalPaper: '原文链接',
    bibtex: 'BibTeX',
    code: '代码',
    correspondingAuthor: '* 通讯作者',
  },
  footer: {
    lastUpdated: '最近更新',
    builtWithPrism: '由 PRISM 构建',
    refinedBy: '由 Kian Yan 完善',
  },
};

export const messages: Record<string, LocaleMessages> = {
  en,
  zh,
};

export function getMessages(locale: string): LocaleMessages {
  return messages[locale] || en;
}
