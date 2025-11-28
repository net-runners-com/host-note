import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/common/Button";
import { Card } from "../../components/common/Card";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { logError } from "../../utils/errorHandler";
import { toast } from "react-toastify";

interface Preset {
  id: number;
  name: string;
  text: string;
}

interface Blank {
  id: number;
  answer: string;
  userAnswer: string;
}

interface Problem {
  id: number;
  text: string;
  blanks: Blank[];
}

interface TextPart {
  type: "text" | "blank";
  content?: string;
  id?: string;
  answer?: string;
  length?: number;
}

const underlineThickness = 1;
const fontSize = 15;
const containerWidth = 650;

export default function FillInTheBlankPage() {
  const navigate = useNavigate();

  const [originalText, setOriginalText] = useState("");
  const [problems, setProblems] = useState<Problem[]>([]);
  const [showAnswers, setShowAnswers] = useState(false);
  const [fullTextAnswers, setFullTextAnswers] = useState<
    Record<string, string>
  >({});
  const [fullTextStructure, setFullTextStructure] = useState<TextPart[][]>([]);
  const [questionType, setQuestionType] = useState<"input" | "choice">("input");
  const [fullTextChoices, setFullTextChoices] = useState<
    Record<string, string[]>
  >({});
  const [presets, setPresets] = useState<Preset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState("");
  const [presetName, setPresetName] = useState("");
  const [randomBlankCount, setRandomBlankCount] = useState(3);

  // プリセットをlocalStorageから読み込み
  useEffect(() => {
    const savedPresets = localStorage.getItem("fillInTheBlankPresets");
    if (savedPresets) {
      try {
        setPresets(JSON.parse(savedPresets));
      } catch (error) {
        logError(error, { component: "FillInTheBlank", action: "loadPresets" });
      }
    }
  }, []);

  // プリセットをlocalStorageに保存
  useEffect(() => {
    if (presets.length > 0) {
      localStorage.setItem("fillInTheBlankPresets", JSON.stringify(presets));
    }
  }, [presets]);

  const savePreset = () => {
    if (!presetName.trim() || !originalText.trim()) {
      toast.error("プリセット名と文章を入力してください");
      return;
    }
    const newPreset: Preset = {
      id: Date.now(),
      name: presetName,
      text: originalText,
    };
    setPresets([...presets, newPreset]);
    setPresetName("");
    toast.success("プリセットを保存しました");
  };

  const deletePreset = (id: number) => {
    if (window.confirm("このプリセットを削除しますか？")) {
      setPresets(presets.filter((p) => p.id !== id));
      if (selectedPreset === id.toString()) {
        setSelectedPreset("");
      }
      toast.success("プリセットを削除しました");
    }
  };

  const selectPreset = (id: number) => {
    const preset = presets.find((p) => p.id === id);
    if (preset) {
      setOriginalText(preset.text);
      setSelectedPreset(id.toString());
    }
  };

  // 文章から意味のある区切りで単語を抽出
  const extractWords = (text: string): string[] => {
    const words: string[] = [];
    const lines = text.split("\n");

    lines.forEach((line) => {
      if (!line.trim()) return;

      const cleanLine = line.replace(/【[^】]+】/g, "");
      if (!cleanLine.trim()) return;

      const tempWords: string[] = [];
      const particles = [
        "は",
        "が",
        "を",
        "に",
        "で",
        "と",
        "から",
        "まで",
        "より",
        "へ",
        "の",
        "ので",
        "のに",
        "て",
        "ば",
        "も",
        "や",
        "か",
        "など",
      ];

      let currentPos = 0;
      let sentence = cleanLine;

      const positions: Array<{
        index: number;
        particle: string;
        length: number;
      }> = [];

      particles.forEach((particle) => {
        let index = sentence.indexOf(particle, currentPos);
        while (index !== -1) {
          positions.push({ index, particle, length: particle.length });
          index = sentence.indexOf(particle, index + 1);
        }
      });

      positions.sort((a, b) => a.index - b.index);

      let lastIndex = 0;
      positions.forEach(({ index, length }) => {
        if (index > lastIndex) {
          const before = sentence.substring(lastIndex, index).trim();
          if (before.length >= 2 && before.length <= 10) {
            tempWords.push(before);
          }
        }

        const start = Math.max(0, index - 5);
        const end = Math.min(sentence.length, index + length);
        const withParticle = sentence.substring(start, end).trim();
        if (withParticle.length >= 2 && withParticle.length <= 10) {
          tempWords.push(withParticle);
        }

        lastIndex = index + length;
      });

      if (lastIndex < sentence.length) {
        const remaining = sentence.substring(lastIndex).trim();
        if (remaining.length >= 2 && remaining.length <= 10) {
          tempWords.push(remaining);
        }
      }

      if (tempWords.length === 0) {
        const chars = sentence.trim();
        for (let i = 0; i < chars.length; i += 4) {
          const word = chars.substring(i, Math.min(i + 4, chars.length)).trim();
          if (word.length >= 2 && word.length <= 8) {
            tempWords.push(word);
          }
        }
      }

      words.push(...tempWords);
    });

    const uniqueWords = [...new Set(words)].filter((w) => {
      return (
        w.length >= 2 &&
        w.length <= 10 &&
        !w.match(/^[0-9]+$/) &&
        w.trim().length > 0
      );
    });

    return uniqueWords;
  };

  const createRandomProblems = () => {
    if (!originalText.trim()) return;

    let cleanText = originalText.replace(/【([^】]+)】/g, "$1");
    const words = extractWords(cleanText);

    if (words.length === 0) {
      toast.error("適切な単語が見つかりませんでした");
      return;
    }

    if (randomBlankCount === 0) {
      setOriginalText(cleanText);
      createProblems();
      return;
    }

    const selectedWords: string[] = [];
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    const count = Math.min(randomBlankCount, shuffled.length);

    for (let i = 0; i < count; i++) {
      selectedWords.push(shuffled[i]);
    }

    let processedText = cleanText;
    const wordPositions: Array<{ word: string; start: number; end: number }> =
      [];

    selectedWords.forEach((word) => {
      const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escapedWord, "g");
      let match: RegExpExecArray | null;
      while ((match = regex.exec(processedText)) !== null) {
        const isOverlapping = wordPositions.some(
          (pos) =>
            (match!.index >= pos.start && match!.index < pos.end) ||
            (match!.index + word.length > pos.start &&
              match!.index + word.length <= pos.end)
        );
        if (!isOverlapping) {
          wordPositions.push({
            word: word,
            start: match!.index,
            end: match!.index + word.length,
          });
          break;
        }
      }
    });

    wordPositions.sort((a, b) => b.start - a.start);
    wordPositions.forEach(({ start, end }) => {
      const before = processedText.substring(0, start);
      const target = processedText.substring(start, end);
      const after = processedText.substring(end);
      processedText = before + `【${target}】` + after;
    });

    setOriginalText(processedText);
    createProblems();
  };

  const createProblems = () => {
    if (!originalText.trim()) return;

    const lines = originalText.split("\n").filter((line) => line.trim());
    const newProblems: Problem[] = [];

    lines.forEach((line, lineIndex) => {
      const regex = /【([^】]+)】/g;
      let match;
      const blanks: Blank[] = [];
      let processedText = line;

      const matches: Array<{
        fullMatch: string;
        content: string;
        index: number;
      }> = [];
      while ((match = regex.exec(line)) !== null) {
        matches.push({
          fullMatch: match[0],
          content: match[1],
          index: match.index,
        });
      }

      matches.reverse().forEach((m, idx) => {
        const blankId = matches.length - idx;
        const before = processedText.substring(0, m.index);
        const after = processedText.substring(m.index + m.fullMatch.length);
        processedText = before + `___BLANK___` + after;

        blanks.unshift({
          id: blankId,
          answer: m.content,
          userAnswer: "",
        });
      });

      if (blanks.length > 0) {
        newProblems.push({
          id: lineIndex,
          text: processedText,
          blanks: blanks,
        });
      }
    });

    setProblems(newProblems);
    setShowAnswers(false);

    const allLines = originalText.split("\n");
    const structure: TextPart[][] = [];
    let blankIdCounter = 0;
    const answers: Record<string, string> = {};

    allLines.forEach((line, lineIdx) => {
      const lineParts: TextPart[] = [];
      let lastIndex = 0;
      const regex = /【([^】]+)】/g;
      let match;

      while ((match = regex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          lineParts.push({
            type: "text",
            content: line.substring(lastIndex, match.index),
          });
        }

        const content = match[1];
        const length = Math.max(content.length, 3);
        const blankId = `full-${lineIdx}-${blankIdCounter++}`;
        lineParts.push({
          type: "blank",
          id: blankId,
          answer: content,
          length: length,
        });
        answers[blankId] = "";

        lastIndex = match.index + match[0].length;
      }

      if (lastIndex < line.length) {
        lineParts.push({
          type: "text",
          content: line.substring(lastIndex),
        });
      }

      structure.push(lineParts);
    });

    setFullTextStructure(structure);
    setFullTextAnswers(answers);

    const choices: Record<string, string[]> = {};
    const allAnswers: string[] = [];

    structure.forEach((lineParts) => {
      lineParts.forEach((part) => {
        if (part.type === "blank" && part.answer) {
          allAnswers.push(part.answer);
        }
      });
    });

    structure.forEach((lineParts) => {
      lineParts.forEach((part) => {
        if (part.type === "blank" && part.id && part.answer) {
          const choiceList = [part.answer];
          const otherAnswers = allAnswers.filter((a) => a !== part.answer);

          const shuffled = [...otherAnswers].sort(() => Math.random() - 0.5);
          for (let i = 0; i < Math.min(2, shuffled.length); i++) {
            if (!choiceList.includes(shuffled[i])) {
              choiceList.push(shuffled[i]);
            }
          }

          const shuffledChoices = choiceList.sort(() => Math.random() - 0.5);
          choices[part.id] = shuffledChoices;
        }
      });
    });

    setFullTextChoices(choices);
  };

  const generatePDFDoc = async () => {
    const doc = new jsPDF();
    const lines = originalText.split("\n");

    const pageWidth = 180;
    const pageHeight = 270;
    const marginLeft = 15;
    const marginTop = 20;
    const marginRight = 15;
    const emptyLineHeight = 3;
    const pdfPageWidthPx = (pageWidth - marginLeft - marginRight) * 3.78;

    let currentY = marginTop;
    let currentPage = 1;

    for (let line of lines) {
      if (line.trim()) {
        const lineContainer = document.createElement("div");
        const containerWidthPx = Math.min(containerWidth, pdfPageWidthPx);
        lineContainer.style.cssText = `
          position: absolute;
          left: -9999px;
          width: ${containerWidthPx}px;
          padding: 2px 5px;
          background: white;
          font-family: "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic", "Meiryo", sans-serif;
          font-size: ${fontSize}px;
          line-height: 1.7;
          word-wrap: break-word;
          overflow-wrap: break-word;
          white-space: pre-wrap;
          word-break: break-all;
          box-sizing: border-box;
        `;

        const lineWithBlanks = line.replace(
          /【[^】]+】/g,
          `<span style="display: inline-block; border-bottom: ${underlineThickness}px solid black; min-width: 70px; margin: 0 2px; vertical-align: bottom;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>`
        );
        lineContainer.innerHTML = lineWithBlanks;

        document.body.appendChild(lineContainer);

        await new Promise((resolve) => setTimeout(resolve, 50));

        const canvas = await html2canvas(lineContainer, {
          useCORS: true,
          logging: false,
          background: "#ffffff",
          width: containerWidthPx,
        });
        const imgData = canvas.toDataURL("image/png");

        const imgWidth = pageWidth - marginLeft - marginRight;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        if (currentY + imgHeight > pageHeight - 10) {
          doc.addPage();
          currentY = marginTop;
          currentPage++;
        }

        doc.addImage(imgData, "PNG", marginLeft, currentY, imgWidth, imgHeight);
        currentY += imgHeight + 2;

        document.body.removeChild(lineContainer);
      } else {
        currentY += emptyLineHeight;
        if (currentY > pageHeight - 10) {
          doc.addPage();
          currentY = marginTop;
          currentPage++;
        }
      }
    }

    return doc;
  };

  const exportToPDF = async () => {
    try {
      const doc = await generatePDFDoc();
      doc.save("穴埋め問題.pdf");
    } catch (error) {
      logError(error, { component: "FillInTheBlank", action: "exportToPDF" });
      toast.error("PDFの生成に失敗しました");
    }
  };

  const handleFullTextAnswerChange = (blankId: string, value: string) => {
    setFullTextAnswers((prev) => ({
      ...prev,
      [blankId]: value,
    }));
  };

  const checkAnswers = () => {
    setShowAnswers(true);
  };

  const resetAnswers = () => {
    setProblems((prev) =>
      prev.map((problem) => ({
        ...problem,
        blanks: problem.blanks.map((blank) => ({ ...blank, userAnswer: "" })),
      }))
    );

    const resetAnswers: Record<string, string> = {};
    Object.keys(fullTextAnswers).forEach((key) => {
      resetAnswers[key] = "";
    });
    setFullTextAnswers(resetAnswers);
    setShowAnswers(false);
  };

  const handleQuestionTypeChange = (newType: "input" | "choice") => {
    setQuestionType(newType);
    const resetAnswers: Record<string, string> = {};
    Object.keys(fullTextAnswers).forEach((key) => {
      resetAnswers[key] = "";
    });
    setFullTextAnswers(resetAnswers);
    setShowAnswers(false);
  };

  const calculateScore = () => {
    let correct = 0;
    let total = 0;

    fullTextStructure.forEach((lineParts) => {
      lineParts.forEach((part) => {
        if (part.type === "blank" && part.id) {
          total++;
          const userAnswer = (fullTextAnswers[part.id] || "").trim();
          const correctAnswer = (part.answer || "").trim();
          if (userAnswer === correctAnswer) {
            correct++;
          }
        }
      });
    });

    return { correct, total };
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Button variant="ghost" onClick={() => navigate("/tools")}>
          ← 戻る
        </Button>
        <h1 className="text-2xl font-bold">シャンパンコールテスト</h1>
        <div></div>
      </div>

      <Card>
        <div className="mb-6 p-4 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)]">
          <div className="mb-4 pb-3 border-b border-[var(--color-border)]">
            <h3 className="text-lg font-semibold mb-1">文章プリセット</h3>
            <p className="text-xs text-[var(--color-text-secondary)]">
              よく使う文章を保存しておけます
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              プリセット名
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="例: フリーコールなど"
                className="flex-1 px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                onKeyPress={(e) => e.key === "Enter" && savePreset()}
              />
              <Button onClick={savePreset}>保存</Button>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              問題文を入力
            </label>
            <textarea
              value={originalText}
              onChange={(e) => setOriginalText(e.target.value)}
              className="w-full h-48 p-4 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-y"
              placeholder="例：&#10;東京は日本の【首都】です。&#10;富士山の高さは【3776】メートルです。&#10;日本の通貨は【円】です。"
            />
            <p className="text-xs text-[var(--color-text-secondary)] mt-2">
              【】で囲んだ部分が穴埋めになります
            </p>
          </div>

          {presets.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                保存済みプリセット
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {presets.map((preset) => (
                  <div
                    key={preset.id}
                    className="flex items-center gap-2 p-3 bg-[var(--color-background)] rounded-lg border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-all"
                  >
                    <button
                      onClick={() => selectPreset(preset.id)}
                      className={`flex-1 text-left px-3 py-2 rounded-lg font-medium transition-all ${
                        selectedPreset === preset.id.toString()
                          ? "bg-[var(--color-primary)] text-[var(--color-background)]"
                          : "hover:bg-[var(--color-surface)] text-[var(--color-text)]"
                      }`}
                    >
                      {preset.name}
                    </button>
                    <button
                      onClick={() => deletePreset(preset.id)}
                      className="px-3 py-2 text-[var(--color-error)] hover:bg-[var(--color-surface)] rounded-lg transition-all font-medium"
                      title="削除"
                    >
                      削除
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-[var(--color-border)]">
            <div className="mb-3">
              <label className="block text-sm font-medium mb-2">
                ランダム穴埋めの数
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={randomBlankCount}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (!isNaN(value) && value >= 0) {
                      setRandomBlankCount(value);
                    }
                  }}
                  min="0"
                  className="w-24 px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-center"
                />
                <span className="text-[var(--color-text)] font-medium">個</span>
              </div>
            </div>
            <Button onClick={createRandomProblems} className="w-full">
              ランダム穴埋めを作成
            </Button>
            <p className="text-xs text-[var(--color-text-secondary)] mt-2 text-center">
              文章から自動的に意味のある単語を抽出して穴埋めにします
            </p>
          </div>
        </div>

        <div className="mb-6 p-4 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)]">
          <label className="block text-sm font-medium mb-3">
            出題形式を選択
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label
              className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${
                questionType === "input"
                  ? "border-[var(--color-primary)] bg-[var(--color-surface)]"
                  : "border-[var(--color-border)] hover:border-[var(--color-primary)] bg-[var(--color-background)]"
              }`}
            >
              <input
                type="radio"
                name="questionType"
                value="input"
                checked={questionType === "input"}
                onChange={(e) =>
                  handleQuestionTypeChange(e.target.value as "input" | "choice")
                }
                className="mr-3 w-5 h-5"
              />
              <div>
                <div className="font-semibold text-[var(--color-text)]">
                  穴埋め入力
                </div>
                <div className="text-xs text-[var(--color-text-secondary)] mt-1">
                  キーボードで直接入力
                </div>
              </div>
            </label>
            <label
              className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${
                questionType === "choice"
                  ? "border-[var(--color-primary)] bg-[var(--color-surface)]"
                  : "border-[var(--color-border)] hover:border-[var(--color-primary)] bg-[var(--color-background)]"
              }`}
            >
              <input
                type="radio"
                name="questionType"
                value="choice"
                checked={questionType === "choice"}
                onChange={(e) =>
                  handleQuestionTypeChange(e.target.value as "input" | "choice")
                }
                className="mr-3 w-5 h-5"
              />
              <div>
                <div className="font-semibold text-[var(--color-text)]">
                  選択肢から選ぶ
                </div>
                <div className="text-xs text-[var(--color-text-secondary)] mt-1">
                  ドロップダウンから選択
                </div>
              </div>
            </label>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={createProblems}
            disabled={!originalText.trim()}
            className="flex-1"
          >
            問題を作成
          </Button>
          {problems.length > 0 && (
            <Button onClick={exportToPDF} variant="secondary">
              PDF保存
            </Button>
          )}
        </div>
      </Card>

      {problems.length > 0 && (
        <Card>
          <div className="mb-6 pb-4 border-b border-[var(--color-border)]">
            <h2 className="text-2xl font-bold mb-2">問題</h2>
            <p className="text-sm text-[var(--color-text-secondary)]">
              下の文章を完成させてください
            </p>
          </div>

          {fullTextStructure.length > 0 && (
            <div className="mb-6 p-5 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)]">
              <div className="mb-4">
                <h3 className="text-base font-semibold text-[var(--color-text)]">
                  全文
                </h3>
              </div>
              <div
                className="leading-relaxed"
                style={{ fontSize: `${fontSize}px`, lineHeight: "1.5" }}
              >
                {fullTextStructure.map((lineParts, lineIdx) => {
                  if (
                    lineParts.length === 0 ||
                    (lineParts.length === 1 &&
                      lineParts[0].type === "text" &&
                      !lineParts[0].content?.trim())
                  ) {
                    return (
                      <div key={lineIdx} className="mb-1">
                        &nbsp;
                      </div>
                    );
                  }

                  return (
                    <div key={lineIdx} className="mb-1">
                      {lineParts.map((part, partIdx) => {
                        if (part.type === "blank" && part.id) {
                          const userAnswer = (
                            fullTextAnswers[part.id] || ""
                          ).trim();
                          const correctAnswer = (part.answer || "").trim();
                          const isCorrect = userAnswer === correctAnswer;

                          if (questionType === "choice") {
                            const choices = fullTextChoices[part.id] || [];
                            return (
                              <span key={partIdx} className="inline-block mx-1">
                                <select
                                  value={userAnswer}
                                  onChange={(e) =>
                                    handleFullTextAnswerChange(
                                      part.id!,
                                      e.target.value
                                    )
                                  }
                                  className={`px-2 py-1 border rounded outline-none transition-colors ${
                                    showAnswers
                                      ? isCorrect
                                        ? "border-[var(--color-success)] bg-[var(--color-surface)] text-[var(--color-success)]"
                                        : "border-[var(--color-error)] bg-[var(--color-surface)] text-[var(--color-error)]"
                                      : "border-[var(--color-border)] bg-[var(--color-background)]"
                                  }`}
                                  style={{
                                    fontSize: `${fontSize}px`,
                                    minWidth: `${Math.max((part.length || 3) * 0.6, 5)}em`,
                                  }}
                                  disabled={showAnswers}
                                >
                                  <option value="">選択してください</option>
                                  {choices.map((choice, choiceIdx) => (
                                    <option key={choiceIdx} value={choice}>
                                      {choice}
                                    </option>
                                  ))}
                                </select>
                                {showAnswers && !isCorrect && (
                                  <span className="ml-2 text-[var(--color-success)] font-medium text-sm">
                                    (正解: {part.answer})
                                  </span>
                                )}
                              </span>
                            );
                          } else {
                            return (
                              <span key={partIdx} className="inline-block mx-1">
                                <input
                                  type="text"
                                  value={userAnswer}
                                  onChange={(e) =>
                                    handleFullTextAnswerChange(
                                      part.id!,
                                      e.target.value
                                    )
                                  }
                                  className={`border-0 px-1 py-0 outline-none transition-colors bg-transparent text-center ${
                                    showAnswers
                                      ? isCorrect
                                        ? "text-[var(--color-success)]"
                                        : "text-[var(--color-error)]"
                                      : ""
                                  }`}
                                  style={{
                                    fontSize: `${fontSize}px`,
                                    minWidth: `${(part.length || 3) * 0.6}em`,
                                    borderBottom: `${underlineThickness}px solid ${
                                      showAnswers
                                        ? isCorrect
                                          ? "var(--color-success)"
                                          : "var(--color-error)"
                                        : "var(--color-border)"
                                    }`,
                                  }}
                                  disabled={showAnswers}
                                />
                                {showAnswers && !isCorrect && (
                                  <span className="ml-2 text-[var(--color-success)] font-medium text-sm">
                                    (正解: {part.answer})
                                  </span>
                                )}
                              </span>
                            );
                          }
                        }
                        return <span key={partIdx}>{part.content}</span>;
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-[var(--color-border)]">
            {!showAnswers ? (
              <Button onClick={checkAnswers} className="w-full">
                答え合わせ
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-6 text-center">
                  <div className="text-sm text-[var(--color-text-secondary)] mb-2">
                    得点
                  </div>
                  <div className="text-4xl font-bold text-[var(--color-primary)]">
                    {calculateScore().correct} / {calculateScore().total}
                  </div>
                  <div className="text-sm text-[var(--color-text-secondary)] mt-2">
                    正答率:{" "}
                    {Math.round(
                      (calculateScore().correct / calculateScore().total) * 100
                    )}
                    %
                  </div>
                </div>
                <Button
                  onClick={resetAnswers}
                  variant="secondary"
                  className="w-full"
                >
                  もう一度挑戦
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
