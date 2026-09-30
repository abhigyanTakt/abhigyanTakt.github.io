$(function () {
  const playerTrack = $("#player-track");
  const albumName = $("#album-name");
  const trackName = $("#track-name");
  const albumArt = $("#album-art");
  const sArea = $("#seek-bar-container");
  const seekBar = $("#seek-bar");
  const trackTime = $("#track-time");
  const seekTime = $("#seek-time");
  const sHover = $("#s-hover");
  const playPauseButton = $("#play-pause-button");
  const tProgress = $("#current-time");
  const tTime = $("#track-length");
  const playPreviousTrackButton = $("#play-previous");
  const playNextTrackButton = $("#play-next");
  const playRepeatButton = $("#play-repeat");

  const albums = [
    "Persona 3 Reload",
    "Persona 3 Reload",
    "Persona 4"
  ];
  const trackNames = [
    "Color Your Night",
    "It's Going Down Now",
    "Heartbeat, Heartbreak"
  ];
  const albumArtworks = ["_1", "_2", "_3"];
  const trackUrl = [
    "assets/music/color-your-night.mp3",
    "assets/music/its-going-down-now.mp3",
    "assets/music/heartbeat-heartbreak.mp3"
  ];

  let audio,
    i = playPauseButton.find("i"),
    seekT,
    seekLoc,
    seekBarPos,
    cM,
    ctMinutes,
    ctSeconds,
    curMinutes,
    curSeconds,
    durMinutes,
    durSeconds,
    playProgress,
    bTime,
    nTime = 0,
    buffInterval = null,
    tFlag = false,
    currIndex = -1,
    currAlbum = "",
    currTrackName = "",
    currArtwork = "",
    loopMode = "all", // "all" (auto-advance & loop playlist), "one" (loop current track), "off" (stop when track ends)
    isTransitioning = false;

  function cycleLoopMode() {
    if (loopMode === "all") {
      loopMode = "one";
      playRepeatButton.removeClass("loop-off").addClass("active-loop");
      playRepeatButton.attr("title", "Mode: Loop Current Track (Click to turn off repeat)");
    } else if (loopMode === "one") {
      loopMode = "off";
      playRepeatButton.removeClass("active-loop").addClass("loop-off");
      playRepeatButton.attr("title", "Mode: Repeat Off (Click for Auto-Next Playlist)");
    } else {
      loopMode = "all";
      playRepeatButton.removeClass("active-loop loop-off");
      playRepeatButton.attr("title", "Mode: Auto-Next Playlist (Click to Loop Track)");
    }
  }

  function handleTrackEnded() {
    if (isTransitioning) return;
    isTransitioning = true;
    setTimeout(function () {
      isTransitioning = false;
    }, 500);

    if (loopMode === "one") {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    } else if (loopMode === "all") {
      // Seamlessly advance to next song
      selectTrack(1);
    } else {
      // Off: pause at end
      i.attr("class", "fas fa-play");
      seekBar.width(0);
      tProgress.text("00:00");
      albumArt.removeClass("buffering").removeClass("active");
      clearInterval(buffInterval);
    }
  }

  function playPause() {
    setTimeout(function () {
      if (audio.paused) {
        playerTrack.addClass("active");
        albumArt.addClass("active");
        checkBuffering();
        i.attr("class", "fas fa-pause");
        audio.play().catch(() => {});
      } else {
        playerTrack.removeClass("active");
        albumArt.removeClass("active");
        clearInterval(buffInterval);
        albumArt.removeClass("buffering");
        i.attr("class", "fas fa-play");
        audio.pause();
      }
    }, 200);
  }

  function showHover(event) {
    seekBarPos = sArea.offset();
    seekT = event.clientX - seekBarPos.left;
    seekLoc = audio.duration * (seekT / sArea.outerWidth());

    sHover.width(seekT);

    cM = seekLoc / 60;
    ctMinutes = Math.floor(cM);
    ctSeconds = Math.floor(seekLoc - ctMinutes * 60);

    if (ctMinutes < 0 || ctSeconds < 0) return;

    if (ctMinutes < 10) ctMinutes = "0" + ctMinutes;
    if (ctSeconds < 10) ctSeconds = "0" + ctSeconds;

    if (isNaN(ctMinutes) || isNaN(ctSeconds)) seekTime.text("--:--");
    else seekTime.text(ctMinutes + ":" + ctSeconds);

    seekTime.css({ left: seekT, "margin-left": "-21px" }).fadeIn(0);
  }

  function hideHover() {
    sHover.width(0);
    seekTime
      .text("00:00")
      .css({ left: "0px", "margin-left": "0px" })
      .fadeOut(0);
  }

  function playFromClickedPos() {
    audio.currentTime = seekLoc;
    seekBar.width(seekT);
    hideHover();
  }

  function updateCurrTime() {
    nTime = new Date().getTime();

    if (!tFlag) {
      tFlag = true;
      trackTime.addClass("active");
    }

    curMinutes = Math.floor(audio.currentTime / 60);
    curSeconds = Math.floor(audio.currentTime - curMinutes * 60);

    durMinutes = Math.floor(audio.duration / 60);
    durSeconds = Math.floor(audio.duration - durMinutes * 60);

    playProgress = (audio.currentTime / audio.duration) * 100;

    if (curMinutes < 10) curMinutes = "0" + curMinutes;
    if (curSeconds < 10) curSeconds = "0" + curSeconds;

    if (durMinutes < 10) durMinutes = "0" + durMinutes;
    if (durSeconds < 10) durSeconds = "0" + durSeconds;

    if (isNaN(curMinutes) || isNaN(curSeconds)) tProgress.text("00:00");
    else tProgress.text(curMinutes + ":" + curSeconds);

    if (isNaN(durMinutes) || isNaN(durSeconds)) tTime.text("00:00");
    else tTime.text(durMinutes + ":" + durSeconds);

    if (
      isNaN(curMinutes) ||
      isNaN(curSeconds) ||
      isNaN(durMinutes) ||
      isNaN(durSeconds)
    )
      trackTime.removeClass("active");
    else trackTime.addClass("active");

    seekBar.width(playProgress + "%");

    if (playProgress >= 100) {
      handleTrackEnded();
    }
  }

  function checkBuffering() {
    clearInterval(buffInterval);
    buffInterval = setInterval(function () {
      if (nTime == 0 || bTime - nTime > 1000) albumArt.addClass("buffering");
      else albumArt.removeClass("buffering");

      bTime = new Date().getTime();
    }, 100);
  }

  function selectTrack(flag) {
    if (flag == 0 || flag == 1) {
      ++currIndex;
      if (currIndex >= albumArtworks.length) {
        currIndex = 0; // Wrap around to first track
      }
    } else {
      --currIndex;
      if (currIndex < 0) {
        currIndex = albumArtworks.length - 1; // Wrap around to last track
      }
    }

    if (flag == 0) i.attr("class", "fas fa-play");
    else {
      albumArt.removeClass("buffering");
      i.attr("class", "fas fa-pause");
    }

    seekBar.width(0);
    trackTime.removeClass("active");
    tProgress.text("00:00");
    tTime.text("00:00");

    currAlbum = albums[currIndex];
    currTrackName = trackNames[currIndex];
    currArtwork = albumArtworks[currIndex];

    audio.src = trackUrl[currIndex];

    nTime = 0;
    bTime = new Date().getTime();

    if (flag != 0) {
      audio.play().catch(() => {});
      playerTrack.addClass("active");
      albumArt.addClass("active");

      clearInterval(buffInterval);
      checkBuffering();
    }

    albumName.text(currAlbum);
    trackName.text(currTrackName);
    albumArt.find("img.active").removeClass("active");
    $("#" + currArtwork).addClass("active");
  }

  function initPlayer() {
    audio = new Audio();
    audio.loop = false;

    selectTrack(0);

    playPauseButton.on("click", playPause);
    sArea.mousemove(function (event) {
      showHover(event);
    });
    sArea.mouseout(hideHover);
    sArea.on("click", playFromClickedPos);

    $(audio).on("timeupdate", updateCurrTime);
    $(audio).on("ended", handleTrackEnded);

    playPreviousTrackButton.on("click", function () {
      selectTrack(-1);
    });
    playNextTrackButton.on("click", function () {
      selectTrack(1);
    });
    playRepeatButton.on("click", cycleLoopMode);
  }

  initPlayer();
});
