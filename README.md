# CanvasGrade: Safari Extension

## Setup Instructions

There are currently no supported ways to install this extension; it is not released and I do not have an apple developer account.

However, if you know what you are doing and have about 20gb of free space and are just dying for a safari port of the Chrome version of this extension, it's possible (barely).

DISCLAIMER: THE SAFARI VERSION IS NOWHERE NEAR FULL FUNCTIONALITY AND NOT SUPPORTED. 

### Safari "Installation" Instructions:

FYI: This is painstaking and likely not worth it. Stop while you still can.

1. Download all source code for the Chrome extension

2. Download Xcode from the Mac App Store

3. Open terminal

4. Run the following command: 
`xcrun safari-web-extension-converter /path/to/extension`
(Replace path to extension with the filepath to the folder containing the downloaded source code)

5. When it asks you if you want to overwrite the directory, the answer is yes.

6. Allow it to open the generated Xcode project, click the build/run button in the top left

7. If everything went right, a litle app that just says click here to turn on the extension should open. If not, see [Apple's Documentation](https://developer.apple.com/documentation/safariservices/safari_web_extensions/converting_a_web_extension_for_safari)

8. Go to safari > preferences > advanced > click yes on "show develop in menu bar"

9. Click develop > allow unsigned extensions

10. Go to safari > preferences > extensions > click the checkmark next to CanvasGrade

If everything worked, you should see a whited-out version of the extension logo to the left of the search bar (at least that's where it is in macOS Big Sur, which is the minimum OS version for this to work)

Again, DO NOT DO THIS unless you know what you are doing. Even then, it's very likely that it's not worth it becuase so far it does not really work even after all that.

## File Explanation:

All of the following files can be found in CanvasGrade Extension/Resources

All other files are generated by the automated terminal converter made by apple and I do not know their purpose. These files are generally necesarry because Apple requires Safari extensions to be packaged as applications which require a lot of files.

Apple is also just... Apple... so naturally, there are like thirty automatically generated files that make the thing work. In the future, I'll learn what these do if I ever really try to develop this port of the extension.

### background.js

This is the javascript file that runs the extension whenever you're on a kent denver canvas grade website.

### icon.png

The logo of the extension:

![logo](https://github.com/Jackman3323/CanvasGrade-Real/raw/CHROME-Master/icon.png)

### manifest.json

This is the "setup" file, it contains various extension information such as the version number, the name, the author's name and the permissions the extension requires to run. It also tells Safari what files do what, for instance, questions like "which file runs the popup window?" are answered by this file.

### modifier.js

This is the "main" file for the portion of the extension that modifies the text of canvas's grade page. This file counts the number of earned points and total points in each category of assignment, calculates your overall grade with that information (and any relevant weighting information, if applicable) and displays that information for the user up where it used to say that such information is disabled.

This file also saves the name of the class, the grade in the class, and whether or not it's an honors/AP class to Safari's storage system for the rest of the extension to use.

This file runs every time any part of any grade is modified (i.e. reverting or changing a "what-if score") which then updates both the overall grade information on that page and the information stored in Safari's storage for the rest of the extension.

FYI: Storage portions are not implemented yet.

### popup.html

This is the html file for the popup window. It starts very bland and with instructions for initial setup. Initial setup of the popup window entails going to the grade page of each of your canvas classes once. 

### popup.js

This is the javascript file for the popup window. It modifies the html window with relevant information it gets from Safari's storage, placed there by modifier.js. Whenever something in storage is updated,this file re-runs itself to update the popup window. The window displays your grade in each class the extension has seen at least once, it's GPA value, and your overall GPA.

### Style.css

This is the stylesheet file for the popup window. I use it to make formatting the window easier. This file only exists for visual purposes.

### successful-installation-cws.png

This is the picture used above in this document to show you what a successful Chrome Web Store installation looks like.
