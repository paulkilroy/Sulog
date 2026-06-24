// On-device OCR of a scanned PDF via PDFKit + Vision (no install needed).
// Usage: swift tools/ocr-pdf.swift <pdf> [maxPages]
import Foundation
import PDFKit
import Vision
import AppKit

let args = CommandLine.arguments
guard args.count >= 2, let doc = PDFDocument(url: URL(fileURLWithPath: args[1])) else {
    FileHandle.standardError.write("cannot open pdf\n".data(using: .utf8)!); exit(1)
}
let maxPages = args.count >= 3 ? (Int(args[2]) ?? doc.pageCount) : doc.pageCount
let scale: CGFloat = 2.0

for i in 0..<min(maxPages, doc.pageCount) {
    guard let page = doc.page(at: i) else { continue }
    let r = page.bounds(for: .mediaBox)
    let w = Int(r.width * scale), h = Int(r.height * scale)
    let img = NSImage(size: NSSize(width: w, height: h))
    img.lockFocus()
    NSColor.white.set(); NSRect(x: 0, y: 0, width: w, height: h).fill()
    if let ctx = NSGraphicsContext.current?.cgContext {
        ctx.scaleBy(x: scale, y: scale)
        page.draw(with: .mediaBox, to: ctx)
    }
    img.unlockFocus()
    guard let tiff = img.tiffRepresentation, let bmp = NSBitmapImageRep(data: tiff),
          let cg = bmp.cgImage else { continue }
    let req = VNRecognizeTextRequest()
    req.recognitionLevel = .accurate
    req.usesLanguageCorrection = false   // Waray unsupported — don't autocorrect to English/Spanish
    let handler = VNImageRequestHandler(cgImage: cg, options: [:])
    try? handler.perform([req])
    print("===PAGE \(i + 1)===")
    if let obs = req.results {
        for o in obs { if let t = o.topCandidates(1).first { print(t.string) } }
    }
    FileHandle.standardError.write("page \(i+1)/\(min(maxPages, doc.pageCount))\n".data(using: .utf8)!)
}
