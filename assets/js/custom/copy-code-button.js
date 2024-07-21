document.addEventListener("DOMContentLoaded", function () {
  const codeBlocks = document.querySelectorAll("pre > code");

  codeBlocks.forEach(function (codeBlock) {
    const button = document.createElement("button");
    button.className = "copy-code-button";
    button.type = "button";
    button.innerHTML = '<i class="fas fa-copy"></i> 복사';

    const pre = codeBlock.parentNode;
    const wrapper = document.createElement("div");
    wrapper.className = "copy-code-wrapper";
    wrapper.style.position = "relative";
    wrapper.style.overflow = "hidden";

    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.appendChild(pre);
    wrapper.appendChild(button);

    button.addEventListener("click", function () {
      const code = codeBlock.innerText;
      navigator.clipboard.writeText(code).then(
        function () {
          button.innerHTML = '<i class="fas fa-check"></i> 복사됨';
          setTimeout(function () {
            button.innerHTML = '<i class="fas fa-copy"></i> 복사';
          }, 2000);
        },
        function (error) {
          button.innerHTML = '<i class="fas fa-times"></i> 에러 발생함';
          console.error("Failed to copy code: ", error);
        }
      );
    });
  });
});
