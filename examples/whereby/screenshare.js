export async function useScreenshare({ recordFrom, streamTo }) {
  // screencast settings
  const settings = {
    format: "jpeg",
    quality: 100,
    everyNthFrame: 1,
    mirrored: false,
  };

  let currFrame; // { data, metadata, settings }

  await streamTo.exposeFunction("getFrame", () => currFrame);

  await streamTo.evaluateOnNewDocument(() => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    const canvasDevice = {
      deviceId: "fake-camera",
      kind: "videoinput",
      label: "Fake Camera",
      groupId: "default",
    };
    canvasDevice.__proto__ = MediaDeviceInfo.prototype;
    const enumerateDevices = navigator.mediaDevices.enumerateDevices;
    navigator.mediaDevices.enumerateDevices = async function () {
      const oldDevices = await enumerateDevices.call(navigator.mediaDevices);
      return [canvasDevice, ...oldDevices];
    };
    // canvas.captureStream();
    const getUserMedia = navigator.mediaDevices.getUserMedia;
    navigator.mediaDevices.getUserMedia = async function () {
      const [constraints] = arguments;
      const isChosen =
        constraints.video.deviceId.exact === canvasDevice.deviceId;
      if (constraints.video && isChosen) return canvas.captureStream();
      const stream = await getUserMedia.apply(
        navigator.mediaDevices,
        arguments
      );
      return stream;
    };

    async function updateImg() {
      const frame = await window.getFrame();
      if (frame) {
        const { settings, data } = frame;

        img.src = `data:image/${settings.format};base64,${data}`;

        await img.decode();

        canvas.width = img.width;
        canvas.height = img.height;

        ctx.save();
        if (settings.mirrored) {
          ctx.scale(-1, 1);
          ctx.translate(-img.width, 0);
        }
        ctx.drawImage(img, 0, 0);
        ctx.restore();
      }
      requestAnimationFrame(updateImg);
    }

    updateImg();
  });

  const client = await recordFrom.target().createCDPSession();

  client.on("Page.screencastFrame", async (image) => {
    const { sessionId, data, metadata } = image;
    currFrame = { data, metadata, settings };
    client.send("Page.screencastFrameAck", { sessionId });
  });

  return {
    async start(screencastOptions) {
      this.setSettings(screencastOptions);
      await client.send("Page.startScreencast", settings);
    },
    async stop() {
      await client.send("Page.stopScreencast");
    },
    setSettings: (screencastOptions) => {
      Object.assign(settings, screencastOptions);
    },
  };
}
