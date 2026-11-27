const films = window.portfolioFilms;
const assetUrl = window.portfolioAssetUrl || (path => path);
const workflowViews = {
  coffee: {sizes: [[2433, 936], [2433, 655]], title: "白瓷杯 · 商品换景", views: [
    ["商品主图流程", "从杯子原图、抠图与参考条件，到 FLUX.2 采样和主图保存。"],
    ["原图与抠图", "白瓷杯原图经过缩放和背景移除后，遮罩与图像进入合成节点。"]
  ]},
  drama: {sizes: [[1960, 1225], [1925, 1190]], title: "真人剧 · 端杯静听", views: [
    ["图生视频流程", "角色首帧、画幅和时长进入 Wan 2.2，再经采样、解码和视频保存。"],
    ["角色首帧与镜头提示", "从男子端杯的首帧出发，结合模型、画幅设置与动作提示生成反应镜头。"]
  ]},
  lora: {sizes: [[1922, 1225], [1628, 1208]], title: "人物 LoRA · 训练验证", views: [
    ["训练与验证流程", "上方读取图片和标注并训练权重，下方使用训练结果生成验证图。"],
    ["试训参数与输出", "这次试训使用 3 步、秩 8、学习率 0.0001，同时记录损失曲线并保存权重。"]
  ]}
};
const cases = {
  ...films,
  coffee: {
    title: "白瓷杯 · 商品换景",
    kind: "电商视觉 / 本地生成",
    video: "media/coffee-motion.mp4",
    poster: "media/coffee-after.webp",
    summary: "ComfyUI 读取素色商品图并生成暖色石台与窗光布景。这个版本采用直接生成的主图以去掉杯把重影。短动效是基于主图另外制作的 2 秒轻推展示。",
    links: [
      ["查看主图", "media/coffee-after.webp"],
      ["原始照片 · Artem Podrez", "https://www.pexels.com/photo/white-ceramic-mug-on-white-table-6800937/"],
      ["换景流程来源 · MattAIstudio", "https://github.com/MattAIstudio/-2026WK2701-ComfyUI-Workflow---Product-Background-Swap"]
    ]
  },
  drama: {
    title: "真人剧镜头 · 端杯静听",
    kind: "ComfyUI 图生视频 / 无声反应镜头",
    duration: "00:02",
    video: "media/drama-reaction.mp4",
    poster: "media/drama-reaction.webp",
    summary: "木墙前，男子端着白杯，视线轻轻移向画外。这段无声反应镜头为工作流单独制作。用同一位虚构角色的近景首帧生成 49 帧，以每秒 24 帧播放。",
    links: [
      ["查看角色首帧", "media/reaction-first-frame.png"],
      ["原版流程 · busterb", "https://github.com/busterb/comfyui"]
    ]
  },
  lora: {
    title: "人物 LoRA · 训练与验证",
    kind: "SD 1.5 / 流程试样",
    poster: "media/lora-portrait.webp",
    secondary: "media/lora-curve.webp",
    summary: "让图片和同名标注进入训练节点，再保存权重、损失曲线与验证图。本例使用虚构角色做了 3 步试训，用来验证输入、保存和出图能顺利连接。",
    links: [
      ["LoRA 训练节点 · ComfyUI", "https://github.com/Comfy-Org/embedded-docs/blob/main/comfyui_embedded_docs/docs/TrainLoraNode/en.md"]
    ]
  }
};

const heroStill = document.querySelector(".feature-image");
const heroPlay = document.querySelector(".feature-play");
const featureTabs = document.querySelectorAll(".film-tab");
for (const tab of featureTabs) {
  tab.addEventListener("click", () => {
    if (tab.getAttribute("aria-pressed") === "true") return;
    for (const other of featureTabs) other.setAttribute("aria-pressed", String(other === tab));
    const title = tab.querySelector("strong").textContent;
    heroStill.src = tab.dataset.still;
    heroStill.alt = tab.dataset.alt;
    heroStill.dataset.feature = tab.dataset.feature;
    heroPlay.dataset.case = tab.dataset.feature;
    heroPlay.setAttribute("aria-label", "播放" + title);
    heroPlay.querySelector("strong").textContent = title;
    heroPlay.querySelector("small").textContent = tab.querySelector("small").textContent;
  });
}

for (const marker of document.querySelectorAll("[data-action-label]")) {
  const film = films[marker.dataset.actionLabel];
  if (film?.video) {
    marker.textContent = "播放 · " + film.duration;
    marker.closest("button").dataset.playable = "yes";
  }
}

const dialog = document.querySelector("#viewer");
const media = document.querySelector("#viewer-media");
const detailLinks = document.querySelector("#viewer-links");
const closeButton = dialog.querySelector(".viewer-close");
const requestedCase = new URLSearchParams(location.search).get("watch");
let returnFocus = null;

function makeImage(src, alt, wide = false) {
  const img = document.createElement("img");
  img.src = assetUrl(src);
  img.alt = alt;
  if (wide) img.className = "poster-wide";
  return img;
}

function releasePlayer() {
  const video = media.querySelector("video");
  if (video) {
    video.pause();
    video.removeAttribute("src");
    video.load();
  }
}

function openCase(id, trigger) {
  const project = cases[id];
  if (!project) return;
  returnFocus = trigger;
  document.querySelector("#viewer-title").textContent = project.title;
  document.querySelector("#viewer-kind").textContent = project.duration ? project.kind + " · " + project.duration : project.kind;
  document.querySelector("#viewer-summary").textContent = project.summary;
  releasePlayer();
  media.replaceChildren();
  detailLinks.replaceChildren();
  if (project.video) {
    const video = document.createElement("video");
    video.controls = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.poster = assetUrl(project.poster);
    video.setAttribute("aria-label", project.title);
    video.src = assetUrl(project.preview || project.video);
    media.append(video);
    video.addEventListener("error", () => {
      if (!media.contains(video) || !video.hasAttribute("src")) return;
      const message = document.createElement("p");
      message.className = "media-error";
      message.textContent = "视频未能载入。";
      const file = document.createElement("a");
      file.textContent = "打开视频文件";
      file.href = assetUrl(project.video);
      file.target = "_blank";
      file.rel = "noopener";
      message.append(file);
      media.append(message);
    }, {once: true});
  } else if (project.secondary) {
    const gallery = document.createElement("div");
    gallery.className = "viewer-twin";
    gallery.append(makeImage(project.poster, "人物验证图"), makeImage(project.secondary, "LoRA 试训损失曲线"));
    media.append(gallery);
  } else if (project.poster) {
    media.append(makeImage(project.poster, project.title + "封面", Boolean(films[id])));
  }
  if (workflowViews[id]) {
    const graphButton = document.createElement("button");
    graphButton.type = "button";
    graphButton.textContent = "查看节点截图";
    graphButton.addEventListener("click", () => openWorkflow(id, graphButton));
    detailLinks.append(graphButton);
  }
  const links = [...(project.links ?? [])];
  if (project.preview) links.unshift(["打开原画质视频", project.video]);
  if (project.video && id !== requestedCase) links.unshift(["单独打开影片", "?watch=" + id]);
  if (project.art) links.unshift(["查看本片角色设定", "#assets-" + id]);
  for (const [label, href, download] of links) {
    const a = document.createElement("a");
    a.textContent = label;
    a.href = href.startsWith("media/") ? assetUrl(href) : href;
    if (download) a.download = "";
    if (href === project.video || href.startsWith("https://") || href.startsWith("?watch=")) {
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    }
    if (href.startsWith("#")) {
      a.addEventListener("click", (event) => {
        event.preventDefault();
        returnFocus = document.querySelector(href + " .art-card");
        dialog.close();
        document.querySelector(href).scrollIntoView({block: "start"});
      });
    }
    detailLinks.append(a);
  }
  dialog.showModal();
  closeButton.focus();
  const player = media.querySelector("video");
  if (player) {
    player.play().catch(error => {
      if (error.name !== "NotAllowedError" || !media.contains(player)) return;
      const hint = document.createElement("p");
      hint.className = "player-status";
      hint.setAttribute("role", "status");
      hint.textContent = "点击播放器开始观看。";
      media.append(hint);
      player.addEventListener("playing", () => hint.remove(), {once: true});
    });
  }
}

for (const trigger of document.querySelectorAll("button[data-case]")) {
  trigger.addEventListener("click", () => openCase(trigger.dataset.case, trigger));
}
closeButton.addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});
dialog.addEventListener("close", () => {
  releasePlayer();
  media.replaceChildren();
  if (returnFocus) returnFocus.focus();
});

const artViewer = document.querySelector("#art-viewer");
const artImage = document.querySelector("#art-image");
const artPrev = artViewer.querySelector('[data-art-step="-1"]');
const artNext = artViewer.querySelector('[data-art-step="1"]');
let artFilm;
let artIndex = 0;
let artTrigger;

function updateArt(index) {
  const item = artFilm.art[index];
  if (!item) return;
  artIndex = index;
  artImage.src = assetUrl(item.src || "media/art/" + item.id + ".webp");
  artImage.alt = item.alt;
  artImage.width = item.width;
  artImage.height = item.height;
  document.querySelector("#art-project").textContent = artFilm.title;
  document.querySelector("#art-title").textContent = item.title + " · " + item.detail;
  document.querySelector("#art-description").textContent = item.alt;
  document.querySelector("#art-position").textContent = (index + 1) + " / " + artFilm.art.length;
  document.querySelector("#art-full").href = artImage.src;
  artPrev.disabled = index === 0;
  artNext.disabled = index === artFilm.art.length - 1;
}

function openArt(collection, index, trigger) {
  artFilm = collection;
  artTrigger = trigger;
  updateArt(index);
  artViewer.showModal();
  artViewer.querySelector(".viewer-close").focus();
}

function openWorkflow(id, trigger) {
  const workflow = workflowViews[id];
  const art = workflow.views.map(([title, alt], index) => ({
    title, alt, detail: index ? "节点局部" : "流程全景",
    src: "media/graphs/" + id + (index ? "-detail" : "-overview") + ".webp",
    width: workflow.sizes[index][0], height: workflow.sizes[index][1]
  }));
  openArt({title: workflow.title, art}, 0, trigger);
}
for (const button of document.querySelectorAll("[data-graph]")) {
  button.addEventListener("click", () => openWorkflow(button.dataset.graph, button));
}

for (const group of document.querySelectorAll("[data-assets-for]")) {
  const film = films[group.dataset.assetsFor];
  film.art.forEach((item, index) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "art-card";
    card.setAttribute("aria-label", "放大查看" + item.title + "的" + item.detail);
    const frame = document.createElement("span");
    frame.className = "art-frame";
    const img = document.createElement("img");
    img.alt = item.alt;
    img.loading = "lazy";
    img.decoding = "async";
    img.width = item.width;
    img.height = item.height;
    img.src = assetUrl("media/art/" + item.id + "-640.webp");
    frame.append(img);
    const caption = document.createElement("span");
    caption.className = "art-caption";
    const name = document.createElement("strong");
    name.textContent = item.title;
    const detail = document.createElement("span");
    detail.textContent = item.detail;
    caption.append(name, detail);
    card.append(frame, caption);
    card.addEventListener("click", () => openArt(film, index, card));
    group.querySelector(index < 2 ? ".role-grid" : ".extra-grid").append(card);
  });
}
for (const button of [artPrev, artNext]) {
  button.addEventListener("click", () => updateArt(artIndex + Number(button.dataset.artStep)));
}
artViewer.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
    event.preventDefault();
    updateArt(artIndex + (event.key === "ArrowLeft" ? -1 : 1));
  }
});
artViewer.querySelector(".viewer-close").addEventListener("click", () => artViewer.close());
artViewer.addEventListener("click", event => { if (event.target === artViewer) artViewer.close(); });
artViewer.addEventListener("close", () => { if (artTrigger) artTrigger.focus(); });

const comparison = document.querySelector(".compare");
const slider = comparison.querySelector("input");
slider.addEventListener("input", () => {
  comparison.style.setProperty("--split", slider.value + "%");
});

if (requestedCase && Object.hasOwn(cases, requestedCase) && cases[requestedCase].video) {
  openCase(requestedCase, document.querySelector('button[data-case="' + requestedCase + '"]'));
}
