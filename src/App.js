/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable no-lone-blocks */
import { useCallback,useState } from "react";
import jsPDF from "jspdf";
import "./App.css";
import { Document, Page, pdfjs } from "react-pdf";
import imageCompression from "browser-image-compression";

function App() {
  const [compressedImages, setCompressedImages] = useState([]);
  const [compressedLink, setCompressedLink] = useState("");
  const [originalImage, setOriginalImage] = useState("");
  const [originalLink, setOriginalLink] = useState("");
  const [clicked, setClicked] = useState(false);
  const [uploadImage, setUploadImage] = useState(false);
  const [outputFileName, setOutputFileName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [numPages, setNumPages] = useState(null);
  const [imageUrlArray, setImageUrlArray] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [selectedPDFFile, setSelectedPDFFile] = useState();
  const [download, setDownload] = useState(null);
  // view is a boolean that is used to trigger the view
  const [view, setView] = useState(null);

  const [isComplete, setIsComplete] = useState(false);
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

  const handleImage = useCallback(
    (event) => {
      setImageUrlArray([]);
      const file = event.target.files[0];
      if (!!file?.type?.length && file.type === "application/pdf") {
        setIsLoading(true);
        setSelectedPDFFile(file);
      } else if (!!file?.type?.length) {
        setFileType("image");
        setImageUrlArray([URL.createObjectURL(file).toString()]);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps

    [
      setSelectedPDFFile,
      setImageUrlArray,
      imageUrlArray,
      setIsLoading,
      isLoading,
    ]
  );

  const onLoadSuccess = useCallback(
    ({ numPages }) => {
      setNumPages(numPages);
      setIsLoading(false);
    },
    [setNumPages, numPages, setIsLoading]
  );

  const onRenderSuccess = useCallback(
    (pageIndex) => {
      Array.from(new Array(numPages), (el, index) => {
        const importPDFCanvas = document.querySelector(
          `.import-pdf-page-${index + 1} canvas`
        );

        pageIndex === index &&
          importPDFCanvas.toBlob((blob) => {
            setImageUrlArray((prev) => [...prev, blob]);
          });
      });
    },
    [numPages, setImageUrlArray]
  );

  //This will be called when user clicks on Compress Button
  function click() {
    const compressedImagesArray = [];

    imageUrlArray.map((img) => {
      var imageFile = img;
      setOriginalImage(imageFile[1]);
      setOutputFileName(imageFile.name);
      setUploadImage(true);
      console.log("originalFile instanceof Blob", imageFile instanceof Blob);

      const options = {
        maxSizeMB: 3,
        maxWidthOrHeight: 500,
        useWebWorker: true,
      };

      if (imageFile.size <= 3 * 1024) {
        // If the size is 3MB or less, add the original image without compression
        compressedImagesArray.push(imageFile);
        alert("file size must greater than 3MB ");
        return 0;
      }

      if (imageFile.size > 10 * 1024 * 1024) {
        alert("File size is too large. Bring a smaller file.");
        return 0;
      }

      // this code will compress the original image
      imageCompression(imageFile, options).then((compressedImage) => {
        compressedImagesArray.push(compressedImage);

        if (compressedImagesArray.length === imageUrlArray.length) {
          // All images are compressed, create a PDF
          const doc = new jsPDF("p", "mm", "a4");

          compressedImagesArray.forEach((compressedImage, index) => {
            const imageData = URL.createObjectURL(compressedImage);
            const defaultWidth = 210;
            const defaultHeight = 297;

            const imgWidth = doc.getImageProperties(imageData).width;
            const imgHeight = doc.getImageProperties(imageData).height;
            const ratio = imgWidth / imgHeight;
            const width = defaultWidth;
            const height = width / ratio;
            // add the image to the document
            doc.addImage(imageData, "JPEG", 0, 0, width, height);
            // when the image is not the last one, add a new page
            if (index < compressedImagesArray.length - 1) doc.addPage();
          });
          doc.save(`compressed_file.pdf`);
          const pdf = doc.output("dataurlstring");
          setDownload(pdf);
          // set the view state to the bloburl
          setView(doc.output("bloburl"));
          // set the isComplete state to true
          setIsComplete(true);
        }
      });
    });

    setClicked(true);
    return 1;
  }

  return (
    <div>
      <main className={`main`}>
        <h1 className={`title`}>Compress your PDF file</h1>
        <label htmlFor="upload" className={`download`}>
          Upload PDF
        </label>
        <input
          style={{ display: "none" }}
          id="upload"
          type="file"
          onChange={handleImage}
        />

        {isLoading && <div className={`loader`} />}

        {selectedPDFFile && (
          <div className={`image`}>
            {imageUrlArray[imageUrlArray.length - 1] && (
              <div key={{ date: new Date().now }}>
                <a onClick={click} className={`download`} download>
                  Compress
                </a>
              </div>
            )}
            <Document
              file={selectedPDFFile}
              onLoadSuccess={onLoadSuccess}
              error={<div>An error occurred!</div>}
            >
              {Array.from(new Array(numPages), (el, index) => (
                <>
                  <div style={{ display: "none" }}>
                    <Page
                      key={`page_${index + 1}`}
                      pageNumber={index + 1}
                      className={`import-pdf-page-${index + 1} ${`image`} ${
                        fileType === "image" && `none`
                      }`}
                      onRenderSuccess={() => onRenderSuccess(index)}
                      width={1024}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      error={<div>An error occurred!</div>}
                    />
                  </div>
                </>
              ))}
            </Document>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
