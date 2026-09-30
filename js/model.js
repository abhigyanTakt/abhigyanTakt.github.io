/* =====================================================================
   MODEL — the data and state of the app. Never touches the DOM.
   Edit your content here: featured projects, skills, image overrides.
   ===================================================================== */

const Model = {

  githubUser: "abhigyanTakt",

  // Where the contact form delivers (via formsubmit.co relay)
  contactEmail: "abhigyan@example.com",

  // App state (read/written by the Controller, displayed by the View)
  state: {
    screen: "home",        // which screen is showing
    menuIndex: 0,          // selected item on the home menu
    reposLoaded: false,
    skillsBuilt: false,
  },

  // ---- Featured projects (hand-written, shown above the GitHub feed) ----
  featured: [
    {
      title: "FAKESPOT AI",
      tag: "AI · Vision", color: "#3dc8ff", live: true,
      url: "https://fake-spot-ai-9rwz.vercel.app/", cta: "Live App ↗",
      img: "assets/projects/fakespot.png",
      desc: "Conversational AI powered by GPT-4o-mini to detect fake reviews through text and image analysis.",
    },
    {
      title: "WHITE TOWER AI",
      tag: "AI · Web App", color: "#ff003c", live: true,
      url: "https://6abcc596fec4680007f86334--reliable-paprenjak-f931d7.netlify.app/", cta: "Live App ↗",
      img: "assets/projects/whitetower.png",
      desc: "Modern AI application with responsive conversational intelligence and clean interactive UI.",
    },
    {
      title: "WEATHER PREDICTION AI",
      tag: "ML · Streamlit", color: "#00d2ff", live: true,
      url: "https://weatherdata-analysis-and-prediction-ogrgjqpusuptvpo7s88d64.streamlit.app/", cta: "Live App ↗",
      img: "assets/projects/weather.png",
      desc: "Analyze historical weather data and predict future temperature trends with time series regression.",
    },
  ],

  // Repos already shown in "featured" get hidden from the GitHub feed
  featuredRepoNames: [
    "FakeSpot-Ai-",
    "Weather_Data-Analysis-and-Prediction",
  ],

  // Repos excluded by user request: url shortner, amazon ml challenges, online fun location, abhigyanTakt, healthclinic, fitpose
  excludedRepoNames: [
    "URL-SHORTER",
    "Amazon-ML-CHALLENGE",
    "Online_fun_location_share",
    "abhigyanTakt",
    "Health-Clinic-Management-System",
    "Fitpose-Prototype",
  ],

  // Repos to always show in All Repositories
  extraRepos: [
    {
      name: "Personalized-Guidance-Chatbot",
      language: "Python",
      stargazers_count: 0,
      html_url: "https://github.com/abhigyanTakt/Personalized-Guidance-Chatbot",
      description: "Personalized guidance chatbot matching career options using semantic embeddings and vector search.",
    },
    {
      name: "finsentiment",
      language: "Python",
      stargazers_count: 0,
      html_url: "https://github.com/abhigyanTakt/finsentiment",
      description: "Financial market sentiment analysis tool predicting market and stock mood from news and financial text.",
    },
  ],

  isRepoExcluded(name) {
    if (!name) return true;
    const lower = name.toLowerCase().replace(/[-_]/g, "");
    const excludePatterns = [
      "urlshort",
      "amazonml",
      "onlinefun",
      "abhigyantakt",
      "healthclinic",
      "weatherdata",
      "fitpose",
    ];
    if (excludePatterns.some(pat => lower.includes(pat))) return true;

    const skipList = [...this.featuredRepoNames, ...this.excludedRepoNames].map(s => s.toLowerCase());
    return skipList.includes(name.toLowerCase());
  },

  // Shown if the GitHub API can't be reached
  fallbackRepos: [
    {
      name: "Personalized-Guidance-Chatbot",
      language: "Python",
      stargazers_count: 0,
      html_url: "https://github.com/abhigyanTakt/Personalized-Guidance-Chatbot",
      description: "Personalized guidance chatbot matching career options using semantic embeddings and vector search.",
    },
    {
      name: "finsentiment",
      language: "Python",
      stargazers_count: 0,
      html_url: "https://github.com/abhigyanTakt/finsentiment",
      description: "Financial market sentiment analysis tool predicting market and stock mood from news and financial text.",
    },
    {
      name: "Audiofy",
      language: "JavaScript",
      stargazers_count: 0,
      html_url: "https://github.com/abhigyanTakt/Audiofy",
      description: "Speech recognition web application built with modern JavaScript.",
    },
    {
      name: "awesome-coding-projects",
      language: "Markdown",
      stargazers_count: 1,
      html_url: "https://github.com/abhigyanTakt/awesome-coding-projects",
      description: "Curated collection of practical coding projects across varied difficulty levels.",
    },
  ],

  // Optional thumbnail overrides: repo name → image path.
  // Anything not listed is looked up at assets/projects/<RepoName>.png
  projectImages: {},

  langColors: {
    JavaScript: "#5c5af1", TypeScript: "#3178c6", Python: "#3572A5",
    PHP: "#4F5D95", CSS: "#663399", HTML: "#e34c26",
    "Jupyter Notebook": "#DA5B0B", MATLAB: "#e16737", Java: "#b07219", C: "#555", "C++": "#f34b7d",
  },

  // ---- Skills screen ----
  skills: [
    { group: "Web Development", items: [
      ["HTML5 & CSS3", 90], ["JavaScript", 85],
      ["Python & Flask", 85], ["REST APIs", 80],
      ["Git & GitHub", 88],
    ]},
    { group: "AI & Data", items: [
      ["Python", 90], ["OpenAI GPT & Prompting", 86],
      ["Pose Tracking & Vision", 82], ["Vector Search & Embeddings", 80],
      ["Data Analysis", 78],
    ]},
    { group: "Engineering & Soft Skills", items: [
      ["Problem Solving", 92], ["Continuous Daily Learning", 95],
      ["Internship Experience (Codec Solution)", 85], ["Team Collaboration", 88],
    ]},
  ],

  // ---- Data fetching ----
  async fetchRepos() {
    let repos = [];
    let live = false;
    try {
      const res = await fetch(
        `https://api.github.com/users/${this.githubUser}/repos?per_page=100&sort=updated`
      );
      if (!res.ok) throw new Error(res.status);
      repos = (await res.json()).filter(r => !r.fork && !this.isRepoExcluded(r.name));
      live = true;
    } catch {
      repos = this.fallbackRepos.filter(r => !this.isRepoExcluded(r.name));
      live = false;
    }

    // Merge in extraRepos (finsentiment, Personalized-Guidance-Chatbot) if not already present
    const existingNames = new Set(repos.map(r => r.name.toLowerCase()));
    this.extraRepos.forEach(extra => {
      if (!existingNames.has(extra.name.toLowerCase())) {
        repos.push(extra);
      }
    });

    return { repos, live };
  },
};
