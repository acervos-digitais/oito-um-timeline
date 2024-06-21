function createImageElement(frameData, obs) {
  const imgWrapperEl = document.createElement("div");
  const imgEl = document.createElement("img");

  imgWrapperEl.classList.add("image-wrapper");
  imgEl.classList.add("image-image");

  imgWrapperEl.setAttribute("data-video-src", frameData.file);
  imgWrapperEl.setAttribute("data-video-seek", frameData.time);

  imgWrapperEl.innerHTML = "Loading...";
  imgWrapperEl.style.width = `${100 / NUM_COLS}%`;

  const cname = frameData.file.replace(/\/.+$/, "");
  const fname = `${Math.floor(frameData.timestamp)}.jpg`
  const imgSrc = `${IMAGES_URL}/${cname}/${fname}`;

  imgWrapperEl.innerHTML = "";
  imgWrapperEl.appendChild(imgEl);
  imgEl.src = imgSrc;

  if (obs) {
    mObserver.observe(imgWrapperEl);
  }

  return imgWrapperEl;
}

let mObserver = null;
let cFrames = [];
let cFrameIdx = 0;

document.addEventListener("DOMContentLoaded", async (_) => {
  const frameData = await fetchData(OBJS_URL);

  const selInputEl = document.getElementById("selection-container");
  const imagesEl = document.getElementById("images-container");

  const overlayEl = document.getElementById("overlay");
  const overlayVideoEl = document.getElementById("overlay-video");
  const overlayVideoSrcEl = document.getElementById("overlay-video-source");

  frameOnscreen = (entries, _) => {
    entries.forEach((entry) => {
      const eEl = entry.target;
      if (entry.isIntersecting) {
        mObserver.unobserve(eEl);
        cFrameIdx = loadFrames(cFrames, cFrameIdx);
      }
    });
  };

  mObserver = new IntersectionObserver(frameOnscreen, {
    threshold: 0.01,
  });

  function loadFrames(frames, startIdx, numFrames = 10) {
    const lastIdx = Math.min(startIdx + numFrames, frames.length);
    for (let i = startIdx; i < lastIdx; i++) {
      const mImgEl = createImageElement(frames[i], i == lastIdx - 2);
      imagesEl.appendChild(mImgEl);

      mImgEl.style.maxHeight = `${mImgEl.offsetWidth * 9 / 16}px`;

      mImgEl.addEventListener("click", (ev) => {
        const vidFile = ev.currentTarget.getAttribute("data-video-src");
        const vidPos = ev.currentTarget.getAttribute("data-video-seek");
        const vidSrc = `${VIDEOS_URL}/${vidFile}`;

        overlayVideoSrcEl.setAttribute("src", vidSrc);
        overlayVideoEl.currentTime = vidPos;
        overlayVideoEl.load();

        overlayEl.classList.add("visible");
      });
    }
    return lastIdx;
  }

  function updateVideosByObject(cObject) {
    imagesEl.innerHTML = "";
    cFrames = frameData.objects[cObject].map((fi) => {
      const mF = { ...frameData.frames[fi] };
      mF.file = frameData.files[mF.file];
      return mF;
    });

    cFrameIdx = loadFrames(cFrames, 0);
  }

  Object.keys(frameData.objects).forEach((o) => {
    const optButEl = document.createElement("button");
    optButEl.classList.add("object-option-button");
    optButEl.setAttribute("data-option", o);
    optButEl.innerHTML = o;

    optButEl.addEventListener("click", (ev) => {
      selInputEl.childNodes.forEach((e) => e.classList.remove("selected"));

      const el = ev.target;
      el.classList.add("selected");
      const selObj = el.getAttribute("data-option");
      updateVideosByObject(selObj);
    });
    selInputEl.appendChild(optButEl);
  });

  overlayEl.addEventListener("click", () => {
    overlayEl.classList.remove("visible");

    overlayVideoEl.pause();
    overlayVideoSrcEl.setAttribute("src", "");
    overlayVideoEl.load();
  });

  overlayVideoEl.addEventListener("click", (ev) => {
    ev.stopPropagation();
  });
});
