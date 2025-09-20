export const saveFormatPdf = async (
  nodes: NodeListOf<Element>,
  fileName: string,
  format: "a3" | "a4",
  orientation: "l" | "p",
  onEnd: () => void,
) => {
  const exportFileName = `${fileName}.pdf`;
  const imageSize = {
    ["a4"]: {
      ["l"]: {
        w: 297,
        h: 210,
      },
      ["p"]: {
        w: 210,
        h: 297,
      },
    },
    ["a3"]: {
      ["l"]: {
        w: 420,
        h: 297,
      },
      ["p"]: {
        w: 297,
        h: 420,
      },
    },
  };

  if (!nodes.length) {
    console.warn("No nodes found for params");
    return;
  }

  const { default: jspdf } = await import("jspdf");
  const { default: html2canvas } = await import("html2canvas-pro");
  const pdf = new jspdf({ unit: "mm", format, orientation });

  // Обрабатываем элементы последовательно, а не параллельно
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node && node instanceof HTMLElement) {
      // Добавляем небольшую задержку между обработкой элементов
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const image = await html2canvas(node, {
        useCORS: true,
        // Ограничиваем качество для снижения нагрузки
        scale: 1,
        // Отключаем ненужные опции
        logging: false,
        allowTaint: false,
        // Ограничиваем размер
        width: Math.min(node.offsetWidth, 1920),
        height: Math.min(node.offsetHeight, 1080),
      });

      const { w, h } = imageSize[format][orientation];
      if (image) {
        if (i === 0) {
          pdf.addImage(image, "JPEG", 0, 0, w, h, "", "FAST", 0);
        } else {
          pdf
            .addPage(format, orientation)
            .addImage(image, "JPEG", 0, 0, w, h, "", "FAST", 0);
        }

        // Освобождаем память от обработанного изображения
        image.remove();
      }
    }
  }

  pdf.save(exportFileName);
  onEnd();
};
