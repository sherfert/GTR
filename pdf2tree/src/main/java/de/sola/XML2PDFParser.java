package de.sola;

import com.itextpdf.text.DocWriter;
import com.itextpdf.text.pdf.*;
import org.w3c.dom.*;
import org.w3c.dom.Document;
import org.w3c.dom.Element;

import javax.xml.parsers.*;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.lang.reflect.Constructor;
import java.lang.reflect.Field;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;

/**
 * Parses the XML format created with dumppdf.py back into a PDF file
 */
public class XML2PDFParser {

    // TODO pdf2xml: (echo '<?xml version="1.1"?>' ; dumppdf.py -a -t gtr.pdf) | sed -e 's/&#0;//g' > testgtr.xml

    /**
     * Usage: parser infile outfile
     * @param args
     * @throws Exception
     */
    public static void main(String[] args) throws Exception {
        if(args.length != 2) {
            System.err.println("Usage: parser infile outfile");
            System.err.println(Arrays.asList(args));
            System.exit(1);
        }
        File in = new File(args[0]);
        File out = new File(args[1]);

        new XML2PDFParser(in, out).parse();
    }

    /**
     * Extract the privately kept output stream with reflection
     */
    private static OutputStream getWriterOS(PdfWriter w) {
        try {
            Field field = DocWriter.class.getDeclaredField("os");
            field.setAccessible(true);
            return (OutputStream) field.get(w);
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    /**
     * Extract the privately kept PdfBody with reflection
     */
    private static PdfWriter.PdfBody getWriterBody(PdfWriter w) {
        try {
            Field field = PdfWriter.class.getDeclaredField("body");
            field.setAccessible(true);
            return (PdfWriter.PdfBody) field.get(w);
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    // The writer to write to
    private PdfWriter w;
    // The PDF document
    private com.itextpdf.text.Document pdfDoc;
    // The XML doc to read from
    private Document document;
    // Whether a trailer has been added already. This is needed, because dumppdf.py duplicates the trailer
    private boolean trailerAdded = false;

    /**
     * A new parser
     * @param in the file to read from
     * @param out the file to write to
     * @throws Exception
     */
    public XML2PDFParser(File in, File out) throws Exception  {
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        DocumentBuilder builder = factory.newDocumentBuilder();
        this.document = builder.parse(in);
        Element root = document.getDocumentElement();

        this.pdfDoc = new com.itextpdf.text.Document();
        this.w = PdfWriter.getInstance(this.pdfDoc, new FileOutputStream(out));
    }

    /**
     * Parses the XML into the PDF
     */
    public void parse() throws IOException {
        this.pdfDoc.open();
        processPDF(this.document.getDocumentElement());
        try {
            this.pdfDoc.close();
        } catch(Exception e) {
            // Here we expect:
            // ExceptionConverter: java.io.IOException: The document has no pages.
            // (Because of not using the API the way it is meant to be used)
        }
    }

    /**
     * Writes the Xref Table to the output stream
     */
    private void produceXrefTable(PdfWriter.PdfBody body, OutputStream os,
            PdfIndirectReference root, final PdfIndirectReference info) throws IOException {
        body.writeCrossReferenceTable(os, root,
                info, null,  null, 0);
    }


    private void processPDF(Node xmlNode) throws IOException {
        if (!(xmlNode instanceof Element)) {
            return;
        }
        Element xmlElem = (Element) xmlNode;
        if (!xmlElem.getTagName().equals("pdf")) {
            return;
        }

        // the root, add all children
        NodeList children = xmlNode.getChildNodes();
        for (int i = 0; i < children.getLength(); i++) {
            Node child = children.item(i);
            if (child instanceof Element) {
                Element childElem = (Element) child;
                if (childElem.getTagName().equals("object")) {
                    processObject(childElem);
                } else if (childElem.getTagName().equals("trailer") && !trailerAdded) {
                    trailerAdded = true;

                    PdfWriter.PdfBody body = getWriterBody(w);
                    OutputStream os = getWriterOS(w);

                    PdfDictionary trailerDict = processDictionary(
                            (Element) childElem.getElementsByTagName("dict").item(0));
                    int size = trailerDict.getAsNumber(new PdfName("Size")).intValue();
                    PdfIndirectReference info = (PdfIndirectReference) trailerDict.get(new PdfName("Info"));
                    PdfIndirectReference root = (PdfIndirectReference) trailerDict.get(new PdfName("Root"));

                    // Right before the trailer comes the Xref table
                    produceXrefTable(body, os, root, info);

                    // FIXME the actual size (number of objects counted) would be better?
                    PdfWriter.PdfTrailer trailer = new PdfWriter.PdfTrailer(size,
                            body.offset(),
                            root,
                            info,
                            null,
                            null,
                            0);
                    trailer.toPdf(w, os);
                }

            }
        }
    }

    private void processObject(Element xmlElem) throws IOException {
        int id = Integer.parseInt(xmlElem.getAttribute("id"));
        // There should be one non-whitespace child
        NodeList children = xmlElem.getChildNodes();
        for (int i = 0; i < children.getLength(); i++) {
            Node child = children.item(i);
            if (child instanceof Element) {
                Element childElem = (Element) child;
                // Special handling of streams
                if (childElem.getTagName().equals("stream")) {
                    processStream(childElem, id);
                } else {
                    Object internalObj = processAnyElem(childElem);
                    // Add to the PDF
                    if (internalObj != null && internalObj instanceof PdfObject) {
                        w.addToBody((PdfObject) internalObj, id);
                    }
                }
            }
        }
    }

    private PdfObject processAnyElem(Element xmlElem) throws IOException {
        if (xmlElem.getTagName().equals("dict")) {
            return processDictionary(xmlElem);
        } else if (xmlElem.getTagName().equals("number")) {
            return processNumber(xmlElem);
        } else if (xmlElem.getTagName().equals("literal")) {
            return processLiteral(xmlElem);
        } else if (xmlElem.getTagName().equals("string")) {
            return processString(xmlElem);
        } else if (xmlElem.getTagName().equals("ref")) {
            return processRef(xmlElem);
        } else if (xmlElem.getTagName().equals("list")) {
            return processArray(xmlElem);
        } else if (xmlElem.getTagName().equals("null")) {
            return processNull(xmlElem);
        } else if (xmlElem.getTagName().equals("keyword")) {
            return processKeyword(xmlElem);
        } else {
            String message = "Unknown tag name: " + xmlElem.getTagName();
            throw new RuntimeException("message");
        }
    }

    private void processStream(Element xmlElem, int id) throws IOException {
        Text streamText = (Text) xmlElem.getElementsByTagName("data").item(0).getFirstChild();
        String streamSting = streamText == null ? "" : streamText.getData();
        PdfStream stream = new PdfStream(streamSting.getBytes(StandardCharsets.UTF_8));
        w.addToBody(stream, id);
    }

    private PdfNumber processNumber(Element xmlElem) {
        String numberText = ((Text) xmlElem.getFirstChild()).getData();
        double n = 0;
        try {
            n = Double.parseDouble(numberText);
        } catch (NumberFormatException e) {
            // OK, keep 0 then
        }
        return new PdfNumber(n);
    }

    private PdfNull processKeyword(Element xmlElem) {
        String key = ((Text)xmlElem.getFirstChild()).getData();
        if(!key.equals("null")) {
            throw new RuntimeException("Unknown keyword: " + key);
        }
        return PdfNull.PDFNULL;
    }

    private PdfLiteral processLiteral(Element xmlElem) {
        return new PdfLiteral("/" + ((Text) xmlElem.getFirstChild()).getData());
    }

    private PdfString processString(Element xmlElem) {
        Text text = (Text) xmlElem.getFirstChild();
        return new PdfString(text == null ? "" : text.getData());
    }

    private PdfNull processNull(Element xmlElem) {
        return PdfNull.PDFNULL;
    }

    private PdfIndirectReference processRef(Element xmlElem) {
        int id = Integer.parseInt(xmlElem.getAttribute("id"));

        // Use reflection to bypass the package private access
        Constructor<PdfIndirectReference> constructor = null;
        PdfIndirectReference ref = null;
        try {
            constructor = PdfIndirectReference.class.getDeclaredConstructor(
                    new Class[]{int.class, int.class, int.class});
            constructor.setAccessible(true);
            ref = constructor.newInstance(0, id, 0);
        } catch (Exception e) {
            e.printStackTrace();
        }
        return ref;
    }

    private PdfArray processArray(Element xmlElem) throws IOException {
        int size = Integer.parseInt(xmlElem.getAttribute("size"));
        PdfArray array = new PdfArray();
        NodeList children = xmlElem.getChildNodes();
        for (int i = 0; i < children.getLength(); i++) {
            Node child = children.item(i);
            if (child instanceof Element) {
                Element childElem = (Element) child;
                PdfObject o = processAnyElem(childElem);
                array.add(o);
            }
        }
        return array;
    }

    private PdfDictionary processDictionary(Element xmlElem) throws IOException {
        int size = Integer.parseInt(xmlElem.getAttribute("size"));
        PdfDictionary dict = new PdfDictionary();
        NodeList children = xmlElem.getChildNodes();
        PdfName key = null;
        PdfObject value = null;
        for (int i = 0; i < children.getLength(); i++) {
            Node child = children.item(i);
            if (child instanceof Element) {
                Element childElem = (Element) child;
                if (childElem.getTagName().equals("key")) {
                    key = new PdfName(((Text) childElem.getFirstChild()).getData());
                } else if (childElem.getTagName().equals("value")) {
                    value = processAnyElem((Element) childElem.getFirstChild());
                }
            }
            if (key != null && value != null) {
                dict.put(key, value);
                key = null;
                value = null;
            }
        }
        return dict;
    }
}