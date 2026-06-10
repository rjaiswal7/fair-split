function downloadBillImage(billId,bill_name) {
    const targetDiv = document.getElementById(billId);
    const file_name = bill_name.replaceAll(" ","-");
    if (!targetDiv) {
        console.error(`Target div element with ID "${billId}" not found.`);
        return;
    }

    //console.log("Generating image for Bill ID:", billId);
    
    html2canvas(targetDiv, { logging: false }).then(function (canvas) {
        var imageURI = canvas.toDataURL("image/png");
        var link = document.createElement('a');

        // FIXED: Explicitly appended the file format so the browser safely handles the payload
        link.download = `${file_name}.png`;
        link.href = imageURI;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }).catch(error => {
        console.error("html2canvas download pipeline broke:", error);
    });
}

/**
 * OPTION 2: Converts the target box to a file and opens the device sharing menu
 */
function shareBillToWhatsApp(billId,bill_name) {
    const targetDiv = document.getElementById(billId);
    const file_name = bill_name.replaceAll(" ","-");
    if (!targetDiv) {
        console.error(`Target div element with ID "${billId}" not found.`);
        return;
    }

    html2canvas(targetDiv, { logging: false }).then(function (canvas) {
        canvas.toBlob(function (blob) {
            if (!blob) {
                alert("Could not create image file.");
                return;
            }

            var sharedFile = new File([blob], `${file_name}.png`, { type: 'image/png' });

            // Ensure sharing parameters explicitly match standard Web Share layouts
            const shareData = {
                files: [sharedFile],
                title: 'Bill Split',
                text: `Bill Summary for ${bill_name}`
            };

            // Checking environment permissions cleanly
            if (navigator.canShare && navigator.canShare(shareData)) {
                navigator.share(shareData)
                    .then(function() {
                        console.log('Successfully shared element layout.');
                    })
                    .catch(function (error) {
                        // FIXED: Safely handling user cancel events (AbortError) without breaking console streams
                        if (error.name === 'AbortError') {
                            console.log('User cancelled the action pane interface.');
                        } else {
                            console.error('Sharing system pipeline failed:', error);
                        }
                    });
            } else {
                alert("Your browser does not support sharing files directly. Please use the Download button instead.");
            }
        }, 'image/png');
    }).catch(error => {
        console.error("html2canvas share pipeline broke:", error);
    });
}
