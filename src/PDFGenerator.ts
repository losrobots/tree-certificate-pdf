import { Helper } from "./Helper";
import { GeneratorFunction } from "./types/GeneratorTypes";
import { getTreeCertificateTemplate } from "./templates/tree-certificate-template";
var qs = require('querystring');
const fs = require('fs');
const path = require('path');
import img0 from './assets/images/banner_1.png';
import img1 from './assets/images/banner_2.png';
import img2 from './assets/images/banner_3.png';
import img3 from './assets/images/banner_4.png';
import logo0 from './assets/images/american-forests-logo.png';
import logo1 from './assets/images/canadian-institute.png';
import logo2 from './assets/images/one-tree-planted-logo.png';
import treeIcon from './assets/images/tree-Icon.png';
import linen from './assets/images/linen.jpg';
import rectangle from './assets/images/rectangle.png';

function base64_encode(file) {
  // console.log(file);
  var bitmap = fs.readFileSync(file);
  return new Buffer.from(bitmap).toString('base64');
}

var config = require('../config.json');
var aws = require("aws-sdk");
aws.config.update({
  accessKeyId: config.aws.accessKeyId,
  secretAccessKey: config.aws.secretAccessKey,
  region: config.aws.region
});
var s3 = new aws.S3();
var bucket = "floristone-product-images";

export class PDFGenerator {
  /**
   * This function returns the buffer for a generated PDF of manual
   * @param {any} event - The object that comes for lambda which includes the http's attributes
   * @returns {Array<any>} array of Structure Instructions
   */

  static getPdf: GeneratorFunction = async (event) => {
    try {

      var url = event.queryStringParameters.url;

      const options = {
        width: 1920,
        height: 1080,
        landscape: true,
        printBackground: true,
        margin: { top: "0in", right: "0in", bottom: "0in", left: "0in" },
      };

      const pdf = await Helper.getPdfBuffer(url, null, options);

      return {
        headers: {
          "Content-type": "application/pdf"
          // , "Content-Disposition": "attachment; filename=restfile.pdf"
        },
        statusCode: 200,
        body: pdf.toString("base64"),
        isBase64Encoded: true,
      };
    } catch (error) {
      console.error("Error : ", error);
      return {
        statusCode: 500,
        body: JSON.stringify({
          error,
          message: "Something went wrong",
        }),
      };
    }
  };

  static renderTreeCertificate: GeneratorFunction = async (event) => {
    try {

      console.log(event);
      console.log(event.body);

      var partnerName, partnerLogo, treeImage;

      // check if pdf already exists in s3
      // only works for GET type for time being
      // if (event.queryStringParameters !== null){
      //   const pdf = await Helper.checkExistsInS3(event.queryStringParameters._p);
      //   // exists, return pdf directly
      //   if ("ContentLength" in pdf && pdf.ContentLength > 0){
      //     return {
      //       headers: {
      //         "Content-type": "application/pdf"
      //       },
      //       statusCode: 200,
      //       body: pdf.Body.toString('base64'),
      //       isBase64Encoded: true,
      //     };
      //   }
      // }

      // GET
      // Standard JSON payload in base64 and stored url._p
      if (!event.body){
        console.log(event.queryStringParameters);
        var data = event.queryStringParameters._p;
        var buff = new Buffer.from(data, 'base64');
        data = buff.toString('utf8');
        data = JSON.parse(data);
      }

      // POST
      else {
        var data = event.body;
        var buff = new Buffer.from(data, 'base64');
        data = buff.toString('utf8');
        try {
          data = JSON.parse(data);
          console.log('IS OBJ');
        } catch (e) {
          console.log('NOT OBJ');
          console.log(data);
          data = qs.parse(data);
          console.log(data);
        }
      }

      // console.log(data);
      // data.recipientName = data.recipientName.replace(/([\uE000-\uF8FF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDDFF])/g, '');
      // data.senderName = data.senderName.replace(/([\uE000-\uF8FF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDDFF])/g, '');

      // format date
      if (data.dateOfCertificate != null && data.dateOfCertificate.length > 0){
        var dateOfCertificate = new Date(data.dateOfCertificate);
      }
      else {
        var dateOfCertificate = new Date();
      }
      dateOfCertificate = dateOfCertificate.toLocaleString('en-US', {
        day: 'numeric',
        year: 'numeric',
        month: 'long',
      });

      // partner
      switch(data.partner){
        case "AMERICAN_FORESTS":
          partnerName = 'American Forests';
          partnerLogo = 'data:image/png;base64,' + base64_encode(logo0);
          break;
        case "CANADIAN_INSTITUTE":
          partnerName = 'Canadian Institute of Forestry';
          partnerLogo = 'data:image/png;base64,' + base64_encode(logo1);
          break;
        case "ONE_TREE_PLANTED":
          partnerName = 'One Tree Planted';
          partnerLogo = 'data:image/png;base64,' + base64_encode(logo2);
          break;
      }

      // tree image
      switch(data.treeImage){
        case "PINE":
          treeImage = 'data:image/png;base64,' + base64_encode(img0);
          break;
        case "PALM":
          treeImage = 'data:image/png;base64,' + base64_encode(img1);
          break;
        case "WOODLAND":
          treeImage = 'data:image/png;base64,' + base64_encode(img2);
          break;
        case "AUSTRALIA":
          treeImage = 'data:image/png;base64,' + base64_encode(img3);
          break;
      }

      const html = getTreeCertificateTemplate({
        recipientName: data.recipientName,
        senderName: data.senderName,
        dateOfCertificate: dateOfCertificate,
        numberOfTrees: data.numberOfTrees,
        partnerName: partnerName,
        partnerLogo: partnerLogo,
        treeImage: treeImage,
        title: data.title,
        recipientHeading: data.recipientHeading,
        senderHeading: data.senderHeading,
        dateHeading: data.dateHeading,
        partnerHeading: data.partnerHeading,
        footer: data.footer,
        treeIcon: 'data:image/png;base64,' + base64_encode(treeIcon),
        linen: 'data:image/jpg;base64,' + base64_encode(linen),
        rectangle: 'data:image/png;base64,' + base64_encode(rectangle),
      });

      console.log(html);

      const options = {
        format: "Letter",
        landscape: true,
        printBackground: true,
        margin: { top: "0in", right: "0in", bottom: "0in", left: "0in" },
      };

      const pdf = await Helper.getPdfBuffer(null, html, options);

      // if (event.queryStringParameters !== null){
      //   const storePdf = await Helper.uploadToS3(event.queryStringParameters._p, pdf);
      // }

      return {
        headers: {
          "Content-type": "application/pdf"
        },
        statusCode: 200,
        body: pdf.toString("base64"),
        isBase64Encoded: true,
      };

    } catch (error) {
      console.error("Error : ", error);
      return {
        statusCode: 500,
        body: JSON.stringify({
          error,
          message: "Something went wrong",
        }),
      };
    }
  };

}
