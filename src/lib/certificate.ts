import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function generateCertificatePdf(opts: {
  studentName: string;
  serial: string;
  issuedAt: Date;
  levelName?: string;
}): Promise<Uint8Array> {
  const { studentName, serial, issuedAt, levelName = "Curriculum" } = opts;

  const doc = await PDFDocument.create();
  const page = doc.addPage([842, 595]); // A4 landscape
  const { width, height } = page.getSize();

  const serifBold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const serif = await doc.embedFont(StandardFonts.TimesRoman);
  const sans = await doc.embedFont(StandardFonts.Helvetica);

  const navy = rgb(0.11, 0.16, 0.32);
  const gold = rgb(0.72, 0.57, 0.15);
  const slate = rgb(0.35, 0.38, 0.45);

  // Border
  page.drawRectangle({
    x: 24,
    y: 24,
    width: width - 48,
    height: height - 48,
    borderColor: gold,
    borderWidth: 3,
  });
  page.drawRectangle({
    x: 34,
    y: 34,
    width: width - 68,
    height: height - 68,
    borderColor: navy,
    borderWidth: 1,
  });

  const centerText = (
    text: string,
    y: number,
    font: typeof serif,
    size: number,
    color = navy
  ) => {
    const textWidth = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: (width - textWidth) / 2, y, size, font, color });
  };

  centerText("CERTIFICATE OF COMPLETION", height - 130, serifBold, 30, navy);
  centerText(`— ${levelName} —`, height - 165, sans, 13, gold);

  centerText("This certifies that", height - 230, serif, 15, slate);
  centerText(studentName, height - 275, serifBold, 34, navy);
  centerText(
    "has successfully completed 100% of the curriculum, spanning programming,",
    height - 320,
    serif,
    13,
    slate
  );
  centerText(
    "CAD, presentational skills, the onboarding program, and scenario quests.",
    height - 340,
    serif,
    13,
    slate
  );

  const dateStr = issuedAt.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  centerText(`Issued on ${dateStr}`, height - 400, sans, 12, slate);

  page.drawText(`Certificate ID: ${serial}`, {
    x: 60,
    y: 55,
    size: 9,
    font: sans,
    color: slate,
  });

  return doc.save();
}
