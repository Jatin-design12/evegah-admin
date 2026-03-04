import { request, Request, Response } from 'express';
import { client, pool } from '../../Config/db.connection';
import { exceptionHandler, validHandler,AddExceptionIntoDB } from '../../helper/responseHandler';

import { ResponseStatusCode } from '../../helper/response.status.code';
import status from '../../helper/status';
import { getEnumDetailsRes } from '../../model/admin.model';
import { DB_CONFIGS } from '../../Config/db.queries';
import logger from '../../Config/logging';
import config from '../../Config/config';
import jwt from 'jsonwebtoken';
import { apiMessage } from '../../helper/api-message';
import { adminMessage } from '../../constant/admin-constant';
import { gets3SignedUrls, createAuthToken } from '../../helper/common-function';
import RequestResponse from '../../helper/responseClass';
import CommonMessage from '../../helper/common.validation';
import bcrypt from 'bcryptjs';


let nodemailer = require('nodemailer');
// email transporter is now a no‑op/json transport; AWS SES support removed
import { getUTCdate } from '../../helper/datetime';
let responsestatusCode = new ResponseStatusCode();

const transporter = nodemailer.createTransport({ jsonTransport: true });

export async function GetEnumDetail(req: Request, res: Response) {
    try {
        const user: any = req.query;
        let getEnumArray: any = [];
        let getEnum: getEnumDetailsRes;

        const query = DB_CONFIGS.enumQueries.EnumDetail(user.Enum_type);
        
        await client
            .query(query)
            .then((cursor) => {
                const data: any = cursor;
                
                if (data[1].rows.length > 0) {
                    for (let row of data[1].rows) {
                        getEnum = row;
                        getEnum.enum_id = Number(row.enum_id);
                        getEnumArray.push(getEnum);
                    }
                    return res.status(responsestatusCode.SUCCESS).json({ message: apiMessage.getEnum, status: status.success, statusCode: 200, data: getEnumArray });
                } else {
                    return res.status(responsestatusCode.SUCCESS).json({ message: apiMessage.wrongEnumType, status: status.success, statusCode: 201, data: getEnumArray });
                }
            })
            .catch((e) => {
                AddExceptionIntoDB(req,e);
                return exceptionHandler(res, 1, e.message);
            });
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
} //end of api

export const adminLogin = async (req: Request, res: Response) => {
   // console.log('check api start not ')
    try {
        var convert_obj = JSON.stringify(req.body);
        var requestQuery = JSON.parse(convert_obj);
        if (requestQuery.emailId === undefined || requestQuery.password === '') {
            return validHandler(res, 2);
        } else if (requestQuery.emailId === '' || requestQuery.password === undefined) {
            return validHandler(res, 3);
        } else if (requestQuery.emailId === undefined || requestQuery.password === undefined) {
            return validHandler(res, 1);
        } else {
            const emailId = String(requestQuery.emailId).trim();
            const plainPassword = String(requestQuery.password);

            logger.info(`Login attempt: emailId=${emailId}`);

            const getAdminResult = await pool.query(
                DB_CONFIGS.adminQueries.getAdminByEmailId(),
                [emailId]
            );

            if (!getAdminResult.rows || getAdminResult.rows.length === 0) {
                logger.info('Login: email not found');
                return res.status(responsestatusCode.SUCCESS).json({
                    message: "Email ID doesn't  Exist",
                    statusCode: 422
                });
            }

            const row = getAdminResult.rows[0];
            const storedPassword = row.password;
            let passwordMatch = false;

            if (storedPassword && (storedPassword.startsWith('$2a$') || storedPassword.startsWith('$2b$') || storedPassword.startsWith('$2y$'))) {
                passwordMatch = await bcrypt.compare(plainPassword, storedPassword);
            } else {
                passwordMatch = storedPassword === plainPassword;
            }

            if (!passwordMatch) {
                logger.info('Login: invalid password');
                return res.status(responsestatusCode.SUCCESS).json({
                    message: 'Invalid Password',
                    statusCode: 422
                });
            }

            const access_token: any = await createAuthToken(row.id);
            await addAdminAuthToken(row.id, access_token);

            const { password: _p, admin_auth_token: _t, ...adminData } = row;
            const data = { ...adminData, access_token };

            logger.info(`Login: success for admin id=${row.id}`);
            return res.status(responsestatusCode.SUCCESS).json({
                message: 'Logged In successfully',
                status: status.success,
                statusCode: 200,
                data
            });
        }
    } catch (error: any) {
        AddExceptionIntoDB(req, error);
        return exceptionHandler(res, 1, error.message);
    }
}; //end of api

export const updateAdminPassword = async (req: Request, res: Response) => {
    try {
        var requestQuery = JSON.parse(JSON.stringify(req.body));
        
        if (CommonMessage.IsValid(requestQuery.emailId)==false) {
            return validHandler(res, 2);
        }  if (CommonMessage.IsValid(requestQuery.oldPassword)==false) {
            
            return validHandler(res, 3);
        } 
      if (CommonMessage.IsValid(requestQuery.newPassword)==false) {
        
        return validHandler(res, 4);
    }else {
            const query = DB_CONFIGS.adminQueries.updateAdminPassword(requestQuery.emailId, requestQuery.oldPassword, requestQuery.newPassword);
            await client
                .query(query)
                .then((cursor: any) => {
                    const Data: any = cursor;
                    var output_result: number = Data.rows[0].fn_update_admin_password;
                    switch (output_result) {
                        case 1: {
                            res.status(responsestatusCode.SUCCESS).json({
                                message: "Email ID doesn't  Exist",
                                status: status.success,
                                statusCode: 400
                            });

                            break;
                        }
                        case 0: {
                            res.status(responsestatusCode.SUCCESS).json({
                                message: 'Password Successfully Updated ',
                                status: status.success,
                                statusCode: 200
                            });
                            break;
                        }
                        case -2: {
                            res.status(responsestatusCode.SUCCESS).json({
                                message: 'Invalid Old Password',
                                status: status.success,
                                statusCode: 400
                            });
                            break;
                        }
                        default: {
                            res.status(responsestatusCode.SUCCESS).json({
                                message: 'Something is Wrong',
                                status: status.success,
                                statusCode: 400,
                                data: Data
                            });
                            break;
                        }
                    }
                })
                .catch((e) => {
                    AddExceptionIntoDB(req,e);
                    return exceptionHandler(res, 1, e.message);
                });
        }
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
}; //end of api

export const ResetpasswordEMailGeneration = async (req: Request, res: Response) => {
    try {
        let requestQuery = req.body;
        const token = jwt.sign({ _id: requestQuery.emailId }, config.jwt.RESET_TOKEN_SECRET_KEY, { expiresIn: '15m' });
        const query = DB_CONFIGS.adminQueries.resetpasswordEMailGeneration(requestQuery.emailId, token);
        await client
            .query(query)
            .then((cursor: any) => {
                const Data: any = cursor;
                if (cursor.rows[0].fp_output_result === adminMessage.emailNotExist) {
                    return res.status(responsestatusCode.SUCCESS).json({ message: apiMessage.emailNotExist, status: status.error, statusCode: 422 });
                } else {
                    let getInsta = gets3SignedUrls('09be0305-92f2-43f6-ac7a-0c700e93d272.insta.png');
                    let getFacebook = gets3SignedUrls('61bcfc44-c119-46d7-be0e-2d40b11efa88.facebook2x.png');
                    let getFooter = gets3SignedUrls('abb63b09-86fb-4881-8406-f3d63a681c28.footer_logo.png');
                    let getJewel = gets3SignedUrls('e17d865c-6ee9-45ec-a1b1-7fa9f6e12a8b.jewel-logo.png');
                    let getLinkedIn = gets3SignedUrls('d626fc92-52ea-405c-87f6-596c5364d694.linkedin2x.png');
                    let getTwitter = gets3SignedUrls('a11e7a35-6001-442f-801c-f261e5ab0cb6.twitter2x.png');

                    var mailOptions = {
                        from: 'Contact <contact@kritin.in>',
                        to: requestQuery.emailId, // list of receivers
                        subject: 'Reset Password', // Subject line
                        html: `<!DOCTYPE html>
                        <html>
                        
                        <head>
                            <meta charset="utf-8">
                            <meta name="viewport" content="width=device-width">
                            <title>Forget Password</title>
                            <link
                                href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600&family=Roboto:wght@400;500;700&display=swap"
                                rel="stylesheet">
                        
                            <style>
                                html,
                                body
                               {
                                    margin: 0 auto !important;
                                    padding: 0 !important;
                                    height: 100% !important;
                                    width: 100% !important;
                                    background: #fff;
                                }
                        
                                * {
                                    -ms-text-size-adjust: 100%;
                                    -webkit-text-size-adjust: 100%;
                                }
                        
                                div[style*="margin: 16px 0"] {
                                    margin: 0 !important;
                                }
                        
                                table,
                                td {
                                    mso-table-lspace: 0pt !important;
                                    mso-table-rspace: 0pt !important;
                                }
                        
                                table {
                                    border-spacing: 0 !important;
                                    border-collapse: collapse !important;
                                    table-layout: fixed !important;
                                    margin: 0 auto !important;
                                }
                        
                                a {
                                    text-decoration: none;
                                }
                        
                                /* Email container */
                        
                                .email-body {
                                    padding: 50px 0;
                                }
                        
                                .email-container {
                                    max-width: 700px;
                                    margin: 0px auto;
                                    background-color: #f9f9f9;
                                    border-top: 5px solid #fbbc00;
                                }
                        
                                h2 {
                                    color: #2b303a;
                                    margin-top: 0;
                                    font-weight: 500;
                                    font-family: 'Roboto', sans-serif;
                                    font-size: 30px;
                                }
                        
                                p {
                                    font-size: 15px;
                                    line-height: 1.4;
                                    color: #808389;
                                }
                        
                                body {
                                    font-weight: 400;
                                    font-size: 15px;
                                    line-height: 1.8;
                                    color: rgba(0, 0, 0, .5);
                                    font-family: 'Montserrat', sans-serif;
                                }
                        
                                /* button */
                                .reset_pass {
                                    padding: 0px 15px;
                                    font-size: 17px;
                                    min-width: 200px;
                                    height: 50px;
                                    border-radius: 3px;
                                    filter: drop-shadow(-0.464px 2px 3px rgba(12, 12, 12, 0.12));
                                    border: 0px;
                                    background-image: linear-gradient(0deg, #fdc00a 0%, #ffdb0f 100%);
                                    margin: 70px 0;
                                    margin-top: 30px;
                                    cursor: pointer;
                                }
                        
                                /*  logo */
                        
                                .logo {
                                    text-align: center;
                                    padding: 60px 20px 60px 20px;
                                }
                        
                                .text {
                                    padding: 0 70px;
                                    text-align: center;
                                }
                        
                                /*FOOTER*/
                        
                                .footer {
                                    background-color: #fbbc00;
                                    padding-top: 40px !important;
                                }
                        
                                .footer table {
                                    margin: 0 !important;
                                    width: 100%;
                                }
                        
                                .footer table tr td,
                                .footer table tr th {
                                    vertical-align: bottom;
                                }
                        
                                .footer ul {
                                    margin: 0;
                                    padding: 0;
                                    border-bottom: 1px solid #f9f9f9;
                                    padding-bottom: 20px;
                                    padding-top: 10px;
                                }
                        
                                .footer ul li {
                                    list-style: none;
                                    margin-top: 15px;
                                }
                        
                                ul.social li {
                                    display: inline-block;
                                    margin-right: 10px;
                                }
                        
                                ul.social li img {
                                    width: 45px;
                                }
                        
                                .footer .copyright {
                                    color: #2b303a;
                                    font-size: 12px;
                                    max-width: 257px;
                                    margin: 0 auto;
                                    padding: 20px;
                                    line-height: 1.5;
                                    font-weight: 500;
                                }
                        
                                @media screen and (max-width: 767px) {
                                    .text {
                                        padding: 0% 5%;
                                    }
                        
                                    .footer {
                                        text-align: center;
                                    }
                        
                                    .footer ul {
                                        text-align: center;
                                    }
                        
                                    .link {
                                        width: 100%;
                                    }
                                }
                            </style>
                        </head>
                        
                        <body width="100%">
                            <center class="email-body">
                                <div class="email-container">
                                    <table align="center">
                                        <tr>
                                            <td valign="top">
                                                <table>
                                                    <tr>
                                                        <td class="logo">
                                                            <a href="#"><img src=${getJewel} alt="brand image" /></a>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td valign="middle">
                                                <table>
                                                    <tr>
                                                        <td>
                                                            <div class="text">
                                                                <h2>Forgot Your Password?</h2>
                                                                <p>Click the button below to reset your password</p>

                                                                <a class="reset_pass" href="${config.frontend_Redirect_Url}/${token}">Reset Password</a>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>
                                    <table align="center">
                                        <tr>
                                            <td class="footer text">
                                                <table>
                                                    <tr>
                                                        <td class="bottomFooter">
                                                            <img src=${getFooter} alt="">
                                                            <ul class="social">
                                                                <a href="#">
                                                                    <li>
                                                                        <img src=${getInsta} alt="instgram">
                                                                    </li>
                                                                </a>
                                                                <a href="#">
                                                                    <li>
                                                                        <img src=${getFacebook} alt="facebook">
                                                                    </li>
                                                                </a>
                                                                <a href="#">
                                                                    <li>
                                                                        <img src=${getTwitter} alt="twitter">
                                                                    </li>
                                                                </a>
                                                                <a href="#">
                                                                    <li>
                                                                        <img src=${getLinkedIn} alt="linkedin">
                                                                    </li>
                                                                </a>
                                                            </ul>
                                                            <div class="copyright">Copyright © 2026 Evegah Mobility Pvt Ltd All rights
                                                                reserved.</div>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>
                                </div>
                            </center>
                        </body>
                        
                        </html>`
                    };

                    // send mail with defined transport object
                    transporter.sendMail(mailOptions, function (error: any, info: any) {
                        if (error) {
                            
                        } else {
                            
                        }
                    });

                    return res.status(responsestatusCode.SUCCESS).json({ message: 'Please Check Your Mail For Reset Password Link .', status: status.success, statusCode: 200 });
                }
            })
            .catch((e) => {
                AddExceptionIntoDB(req,e);
                return exceptionHandler(res, 1, e.message);
            });
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};

export const updateAdminPasswordByEmail = async (req: Request, res: Response) => {
    try {
        let requestQuery = req.body;
        const query = DB_CONFIGS.adminQueries.updateAdminPasswordByEmail(requestQuery.password, requestQuery.token);
        await client
            .query(query)
            .then((cursor: any) => {
                const Data: any = cursor;
                if (Data.rows[0].fp_output_result === adminMessage.checkToken) {
                    return res.status(responsestatusCode.SUCCESS).json({ message: Data.rows[0].fp_output_result, status: status.error, statusCode: 422, data: Data });
                } else if (Data.rows[0].fp_output_result === adminMessage.emailNotExist) {
                    return res.status(responsestatusCode.SUCCESS).json({ message: Data.rows[0].fp_output_result, status: status.error, statusCode: 422, data: Data });
                } else {
                    return res.status(responsestatusCode.SUCCESS).json({ message: apiMessage.passwordChange, status: status.success, statusCode: 200 });
                }
            })
            .catch((e) => {
                AddExceptionIntoDB(req,e);
                return exceptionHandler(res, 1, e.message);
            });
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};

const addAdminAuthToken = async (id: any, token: string) => {
    try {
        const getResult = await pool.query(
            DB_CONFIGS.adminQueries.getAuthToken(id)
        );
        const tokenArray: Array<string> = [token];
        tokenArray.push(...(getResult.rows[0]?.admin_auth_token || []));

        await pool.query(DB_CONFIGS.adminQueries.addAuthToken(), [tokenArray, id]);
        return;
    } catch (error) {
        logger.error('addAdminAuthToken failed: ' + (error instanceof Error ? error.message : String(error)));
        return;
    }
};

export const logOutAdmin = async (req: Request, res: Response) => {
    try {
        let result: any;
        let requestBody = req.body;
        let query: any = DB_CONFIGS.adminQueries.getAuthToken(requestBody.id);
        result = await client.query(query);
        let token : any ='';

        for (let i = 0; i <= result.rows[0].admin_auth_token.length; i++) {

            
            if (result.rows[0].admin_auth_token[i] === req.query.access_token) {

                token = result.rows[0].admin_auth_token.filter((item: any) => {

             

                    return item !== req.query.access_token;
                    
                });

                query = { text: DB_CONFIGS.adminQueries.addAuthToken(), values: [token, requestBody.id] };
               
                result = await client.query(query);

                if (result.rowCount > 0) {
                    return RequestResponse.success(res, 'Logout Successfully', status.success, []);
                } else {
                    return RequestResponse.success(res, apiMessage.somethingWentWrong, status.info, []);
                }
            } else {
                return RequestResponse.unauthorized(res, 'user dose not have valid token', status.error, []);
            }
        }
    } catch (error: any) {
        AddExceptionIntoDB(req,error);
        return exceptionHandler(res, 1, error.message);
    }
};


// export const insertAppVersionDetail = async (req: Request, res: Response)=>  {
//     let requestBody=req.body ;
//     let actionOnDate = getUTCdate();
//     requestBody.lastVersionUpdateDate =actionOnDate;
//     requestBody.versionApplyDate =actionOnDate;
//     requestBody.createdOnDate =actionOnDate;
//     let query: any = {
//         text: DB_CONFIGS.versionQueries.insertVersion(),
//         values: [requestBody.newAppVersion,requestBody.appVersionName,requestBody.lastVersionUpdateDate,requestBody.versionApplyDate,requestBody.createdOnDate,requestBody.createdByLoginUserId]
//     };
        
//     console.log('check query', query);
//     return new Promise(async (resolve, reject) => {
//         try {
//             let result = await client.query(query);
//             resolve(result);
//         } catch (error) {
//             reject(error);
//         }
//     });
// }