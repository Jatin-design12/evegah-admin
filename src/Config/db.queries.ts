export const DB_CONFIGS = {
    
    
    mastersQueries:
    {
        checkSectionQuestionExist:() => 
        {
        return `SELECT id FROM  masters.tbl_faq_detail WHERE  UPPER(TRIM(question))=UPPER(TRIM($1)) and id <> $2  and section_id = $3 `
        },

        checkSetionNameExist:() => 
        {
        return `SELECT id FROM  masters.tbl_setion_detail WHERE  UPPER(TRIM(name))=UPPER(TRIM($1)) and id <> $2;`
        },

        addSectionName:() =>
        {
            return `insert into masters.tbl_setion_detail (name,status_enum_id,createdon_date ,createdby_login_user_id,section_sequence) 
                   values ($1,$2,$3,$4,$5) RETURNING id `
        },

        updateSectionName:() =>
        {
            return `update masters.tbl_setion_detail set
            name =$2,
            status_enum_id  = $3,
            updatedon_date = $4,
            updated_login_user_id = $5
                  where id = $1`                 
        },
        addFAQDetail:() =>
        {
            return `insert into masters.tbl_faq_detail (question,answer,faq_publish_status_enum_id,section_id,status_enum_id,createdon_date ,createdby_login_user_id,last_publish_date  ,
                last_unpublish_date,last_published_user_id,last_unpublished_user_id,question_sequence) 
                       values ($1,$2,$3,$4,$5,$6,$7,$8,$9, $10, $11,$12) RETURNING id `
        },

        addFAQSequenceDetail:() =>
        { return `select coalesce(max(question_sequence),0) as q_sequence from masters.tbl_faq_detail where section_id = $1`
    },

    getSectionSequenceDetail:() =>
    { return `select coalesce(max(section_sequence),0) as s_sequence from masters.tbl_setion_detail;`
},


        editFAQDetail:() =>
        {
            return `update masters.tbl_faq_detail set 
                 question  = $2,
                 answer  = $3,
                 faq_publish_status_enum_id  = $4,
                 section_id  = $5,
                 status_enum_id  = $6,
                 updatedon_date = $7 ,
                 updated_login_user_id = $8,
                 last_publish_date = $9,
                 last_unpublish_date  = $10 ,
                 last_published_user_id = $11,
                 last_unpublished_user_id = $12
                       where id = $1`
        },
        updateSequenseFAQ:() =>
        {
            return `update masters.tbl_faq_detail set 
            question_sequence = $2,
                 updatedon_date = $3 ,
                 updated_login_user_id = $4                
                       where id = $1`
        },

        updateSequenseSection:() =>
        {
            return `update  masters.tbl_setion_detail set 
            section_sequence = $2,
                 updatedon_date = $3 ,
                 updated_login_user_id = $4                
                       where id = $1`
        },
        publishUnpublishFAQDetail:() =>
        {
            return `update masters.tbl_faq_detail set                 
                 faq_publish_status_enum_id  = $2,                
                 updatedon_date = $3,
                 updated_login_user_id = $4,
                 last_publish_date = $5,
                 last_unpublish_date = $6,
                 last_published_user_id = $7,
                 last_unpublished_user_id = $8
                where id = $1`
        },
        getSectionList:() => 
        {
        return `SELECT id , name,section_sequence ,
                 createdon_date,updatedon_date 
        FROM  masters.tbl_setion_detail 
                WHERE  (id = $1 OR $1= 0) order by section_sequence asc`
        },

        getFAQListQuery:() => 
        {
        return `SELECT 
        fd.id,
         sd.section_sequence , fd.question_sequence ,
        fd.question,
        fd.answer,
                fd.faq_publish_status_enum_id,
                (select tblenum.enum_key from public.tbl_enum tblenum where tblenum.enum_id=fd.faq_publish_status_enum_id) as faq_publish_status_enum_name,
                fd.section_id,
               sd.name as section_name ,
               
               fd.status_enum_id,fd.createdon_date ,
               fd.createdby_login_user_id , fd.last_publish_date,fd.last_unpublish_date,fd.question_sequence 
                  FROM masters.tbl_faq_detail fd
                  inner join  masters.tbl_setion_detail sd on
                  sd.id = fd.section_id 
                 WHERE (fd.id = $1 OR $1=0) and (fd.section_id = $2 OR $2=0) and (fd.faq_publish_status_enum_id =$3 OR $3=0) 
                 order by sd.section_sequence, fd.question_sequence asc;`
        },

        getpublisheAndUnPublishDateQuery:() => 
        {
        return `SELECT id,last_publish_date,last_unpublish_date,faq_publish_status_enum_id ,last_published_user_id,last_unpublished_user_id  FROM masters.tbl_faq_detail  WHERE 
         (id = $1);`
        },

    },
    addressQueries: {
        getStates: (country_id: any) => {
            return `select * from masters.fn_show_state_list(${country_id}::smallint); fetch all from state`;
        },
        getCities: (state_id: any) => {
            return `select * from masters.fn_show_city(${state_id}::smallint);fetch all from cities`;
        },
        getCountry: () => {
            return `select * from masters.fn_show_country();fetch all from country`;
        }
        
    },


    mapAddressQueries: {
        getMapStates: () => {
            return `select map_state_id,map_state_name from masters.tbl_map_state where( map_country_id =$1 Or $1 =0 ) order by map_country_id ,map_state_name asc`;
        },  
        getmapCountry: () => {
            return `select map_country_id,map_country_name  from masters.tbl_map_country order by map_country_name asc;`;
        } ,
        getMapCity: () => {
            return `select map_city_id , map_city_name  from masters.tbl_map_city where (map_state_id = $1 or $1 =0) order by map_state_id,map_city_name,user_city_name asc `;
        },

        
},

    customerQueries: {
        addUserCheckCustomerMobileNumber: (mobileNumber: Number, statusEnum_id: Number) => {
            return `select * from admin.fn_check_customer_mobile_numbers('${mobileNumber}',${statusEnum_id}); fetch all from mobile_number`;
                 },
    
        addUser: (
            userId: Number,
            customerName: string,
            address: string,
            referralCode: string,
            mobile: string,
            emailId: string,
            dateOfBirth: string,
            genderEnumId: Number,
            userTypeEnumId: Number,
            stateId: Number,
            cityId: Number,
            statusEnumId: Number,
            actionOnDate: string
        ) => {
            return `select * from admin.fn_add_user_return_with_all_detail(
                '${userId}','${customerName}','${address}','${referralCode}','${mobile}', '${emailId}','${dateOfBirth}', 
                '${genderEnumId}','${userTypeEnumId}','${stateId}', '${cityId}','${statusEnumId}','${actionOnDate}');fetch all from user_detail`;
        },
        addUserAuthToken: () => {
            return `update  admin.tbl_admin  set user_auth_token=$1 where id=$2 and status_enum_id=1`;
        },
        getUser: () => {
            return `SELECT tbladmin.id, tbladmin.user_name, tbladmin.emailid, tbladmin.mobile, tbladmin.createdon_date, tbladmin.updatedon_date, tbladmin.auto_referral_code, 
            tbladmin.user_enum_id, 
            (select tblstatus.enum_key from tbl_enum tblstatus where tblstatus.enum_id = tbladmin.user_enum_id) as user_enum_name,
            tbladmin.status_enum_id, 
            (select tblstatus.enum_key from tbl_enum tblstatus where tblstatus.enum_id = tbladmin.status_enum_id) as status_name,
            tbladmin.user_type_enum_id, 
            (select tblstatus.enum_key from tbl_enum tblstatus where tblstatus.enum_id = tbladmin.user_type_enum_id) as user_type_name,
            tbladmin.state_id, 
            (select tblstatus.state_name from masters.tbl_state tblstatus where tblstatus.state_id = tbladmin.state_id) as state_name,
            tbladmin.city_id, 
            (select tblstatus.city_name from masters.tbl_cities tblstatus where tblstatus.city_id = tbladmin.city_id) as city_name,
            tbladmin.referral_code, 
            tbladmin.date_of_birth, 
            tbladmin.gender_enum_id, 
            (select tblstatus.enum_key from tbl_enum tblstatus where tblstatus.enum_id = tbladmin.gender_enum_id) as gender,
            tbladmin.address, 
            tbladmin.auto_gen_user_referral_code,
            tbladmin.min_wallet_amount,
            tbladmin.deposit_amount,
            tbladmin.last_deposit_amount_date,
            tbladmin.last_recharge_amount_date,
            tbladmin.extra_charges,
            tbladmin.subsequently_ride_status,
            tbladmin.registration_status,
            tbladmin.user_driving_status,
            (select tblstatus.enum_key from tbl_enum tblstatus where tblstatus.enum_id = tbladmin.user_driving_status) as user_driving_status_name,
            tbladmin.user_app_language_id,
            (select tblstatus.enum_key from tbl_enum tblstatus where tblstatus.enum_id = tbladmin.user_app_language_id) as user_app_language_name,
            (select count(rb.id)  from  admin.tbl_ride_booking rb where rb.user_id = tbladmin.id and rb.bike_rideing_status=15 limit 1) as total_ride ,
            (select sum(COALESCE(rb.total_ride_amount,0))  from  admin.tbl_ride_booking rb where rb.user_id = tbladmin.id and rb.bike_rideing_status in (15) limit 1) as total_ride_amount ,
            (select cast(SUM(coalesce(distance_in_meters,0)) as numeric)/1000 from  admin.tbl_ride_booking rb where rb.user_id = tbladmin.id and rb.bike_rideing_status=15 limit 1) as total_distance_in_meters ,
            --(select to_ride_time  from  admin.tbl_ride_booking where user_id = tbladmin.id order by to_ride_time desc  limit 1)
            (select max(to_ride_time)  from  admin.tbl_ride_booking where user_id = tbladmin.id ) as last_user_ride_date_time
            FROM admin.tbl_admin  tbladmin WHERE
              (tbladmin.id =  $1 OR $1 = 0) AND
              (tbladmin.status_enum_id =  $2 OR $2 = 0) AND tbladmin.user_type_enum_id = 4 ;`;
        },
        getUserIdByEmailId: () => {
            return `select id from admin.tbl_admin where  UPPER(TRIM(emailid))=UPPER(TRIM($1))`;
        },
        getUserIdByPhoneNumber: () => {
            return `select id from admin.tbl_admin where  UPPER(TRIM(mobile))=UPPER(TRIM($1))`;
        },
        updateUserLanguage: () => {
            return `update admin.tbl_admin set user_app_language_id = $1 where id=$2
            `;
        },
        getTransactionDetailsByUserId: () => {
            return `SELECT tblpay.id, tblpay.user_id, tblpay.payment_id, tblpay.entity, tblpay.amount, tblpay.currency, tblpay.status, tblpay.order_id, tblpay.invoice_id, tblpay.international, tblpay.method, tblpay.amount_refunded, tblpay.refund_status, tblpay.captured, tblpay.description, 
            tblpay.card_id, tblpay.bank, tblpay.wallet, tblpay.vpa, tblpay.email, tblpay.contact, tblpay.notes, tblpay.fee, tblpay.tax, tblpay.error_code, 
            tblpay.error_description, tblpay.error_source, 
            tblpay.error_step, tblpay.error_reason, tblpay.acquirer_data, 
            tblpay.created_at, tblpay.createdon_date, tblpay.updatedon_date,
            tblride.id as rideBookingId, 
                        (select tbladmin.user_name from admin.tbl_admin tbladmin  where tbladmin.id = tblpay.user_id) as user_name,
                        (select tbladmin.min_wallet_amount from admin.tbl_admin tbladmin  where tbladmin.id = tblpay.user_id) as min_wallet_amount,
                        (select tbladmin.extra_charges from admin.tbl_admin tbladmin  where tbladmin.id = tblpay.user_id) as extra_charges,
                        (select tbladmin.deposit_amount from admin.tbl_admin tbladmin  where tbladmin.id = tblpay.user_id) as deposit_amount,
                        tblride.vehicle_model_id, 
                        (select tblvehmod.model_name  FROM masters.tbl_vehicle_model tblvehmod where tblvehmod.id= tblride.vehicle_model_id )as model_name,
                        tblride.vehicle_uid_id,
                        (select tblvehmod.model_uid FROM inventory.tbl_uid tblvehmod where tblvehmod.id = tblride.vehicle_uid_id) model_uid_number,
                        tblride.vehicle_lock_id,
                        (select tblvehmod.lock_number  FROM inventory.tbl_lock_detail tblvehmod where tblvehmod.id= tblride.vehicle_lock_id ) as lock_number,
                        tblride.ride_booking_min,
                        tblride.from_ride_time,
                        tblride.to_ride_time,
                        tblride.actual_ride_time, 
                        tblride.actual_ride_min, 
                        tblride.ride_payment_status, 
                        tblride.hiring_charges, 
                        tblride.pervious_charges,
                        tbllock.location, 
                        tbllock.latitude, 
                        tbllock.longitude,
                        tbllock.altitude
                        FROM admin.tbl_payment_transaction_details tblpay 
                         FULL JOIN  admin.tbl_ride_booking tblride on tblpay.id = tblride.payment_id
                          FULL JOIN   inventory.tbl_lock_detail tbllock on tbllock.id =tblride.vehicle_lock_id   
                          WHERE (tblpay.user_id=$1 or $1=0) order by  tblpay.createdon_date desc;`;
        },
        userMakeWithdrawRequest: () => {
            return `INSERT INTO admin.tbl_withdraw_transaction_details(
                 user_id, amount, createdon_date,withdraw_no ,withdraw_date ,created_user_id)
                VALUES ($1,$2,$3,$4,$5,$6) RETURNING id `;
        },
        updateStatusOfWithdrawRequest: () => {
            return `update  admin.tbl_withdraw_transaction_details set withdraw_request_status_enum_id=$1,updatedon_date=$2 ,processing_date = $4 , processing_user_id =$5 where id = $3  ;`;
        },
        completeTheWithdrawnRequest: () => {
            return `UPDATE admin.tbl_withdraw_transaction_details
            SET   withdraw_request_status_enum_id=$1, payment_id=$2, entity=$3, currency=$4, status=$5, international=false, method=$6,captured=true, description=$7, updatedon_date=$8 ,
            completed_date = $10 ,completed_user_id =$11 WHERE id = $9;`;
        },

        updateStatusCancelledOfWithdrawRequest: () => {
            return `update  admin.tbl_withdraw_transaction_details set withdraw_request_status_enum_id=$1,updatedon_date=$2 ,cancelled_date = $4 , cancelled_user_id =$5 ,cancelled_remark=$6 where id = $3  ;`;
        },
        getWithdrawRequestList: () => {
            return `SELECT tblrequest.id,
             tblrequest.user_id,
             tblrequest.payment_id,
            (select tblstatus.user_name from admin.tbl_admin tblstatus where tblstatus.id = tblrequest.user_id) as user_name,
            (select tblstatus.mobile from admin.tbl_admin tblstatus where tblstatus.id = tblrequest.user_id) as contact_number,
            (select tblstatus.min_wallet_amount from admin.tbl_admin tblstatus where tblstatus.id = tblrequest.user_id) as wallet_amount,
            (select tblstatus.deposit_amount from admin.tbl_admin tblstatus where tblstatus.id = tblrequest.user_id) as deposit_amount,
            tblrequest.withdraw_request_status_enum_id,
            (select tblstatus.enum_key from public.tbl_enum tblstatus where tblstatus.enum_id = tblrequest.withdraw_request_status_enum_id) as withdraw_request_status,
            tblrequest.amount,
            tblrequest.createdon_date,
            tblrequest.updatedon_date ,
            tblrequest.cancelled_date ,
            tblrequest.cancelled_user_id ,
            (select tblstatus.user_name from admin.tbl_admin tblstatus where tblstatus.id = tblrequest.cancelled_user_id) as cancelled_user_name ,
            tblrequest.cancelled_remark
            FROM admin.tbl_withdraw_transaction_details tblrequest
            where ( tblrequest.id =  $1 or  $1 = 0) and 
                   (tblrequest.withdraw_request_status_enum_id = $2 or $2 = 0) and 
                   (tblrequest.user_id = $3 or $3=0)
                   order by  tblrequest.id;`;
        },
        getWithdrawnTransaction: () => {
            return `SELECT tblwithtran.id, 
            tblwithtran.user_id,
            (select tblstatus.user_name from admin.tbl_admin tblstatus where tblstatus.id = tblwithtran.user_id) as user_name,
            (select tblstatus.mobile from admin.tbl_admin tblstatus where tblstatus.id = tblwithtran.user_id) as contact,
            tblwithtran.withdraw_request_status_enum_id,
            (select tblstatus.enum_key from public.tbl_enum tblstatus where tblstatus.enum_id = tblwithtran.withdraw_request_status_enum_id) as withdraw_request_status,
            tblwithtran.payment_id,
            tblwithtran.entity,
            tblwithtran.amount,
            tblwithtran.currency,
            tblwithtran.status,
            tblwithtran.order_id,
            tblwithtran.invoice_id,
            tblwithtran.international,
            tblwithtran.method,
            tblwithtran.amount_refunded,
            tblwithtran.refund_status,
            tblwithtran.captured,
            tblwithtran.description,
            tblwithtran.card_id,
            tblwithtran.bank, 
            tblwithtran.wallet, 
            tblwithtran.vpa,
            tblwithtran.email,
            tblwithtran.notes,
            tblwithtran.fee,
            tblwithtran.tax,
            tblwithtran.error_code,
            tblwithtran.error_description,
            tblwithtran.error_source,
            tblwithtran.error_step,
            tblwithtran.error_reason, tblwithtran.acquirer_data, tblwithtran.createdon_date, tblwithtran.updatedon_date
              FROM admin.tbl_withdraw_transaction_details tblwithtran
              where (tblwithtran.user_id =$1 or $1=0)
              order by tblwithtran.id
              ;`;
        },
        withdrawnWalletAmountFromUserAccount: () => {
            return `UPDATE admin.tbl_admin SET deposit_amount = deposit_amount - $1 ,updatedon_date = $2  WHERE id = $3`;
        },
        payExtraCharges: () => {
            return `UPDATE admin.tbl_admin SET extra_charges=extra_charges - $1 ,updatedon_date = $2  WHERE id = $3`;
        },
        addAmountInWalletAndSubtractExtraCharges: () => {
            return `UPDATE admin.tbl_admin SET min_wallet_amount = min_wallet_amount + $4, extra_charges=extra_charges - $3, updatedon_date = $1  WHERE id = $2`;
        },

        addRechargeAmount: () => {
            return `UPDATE admin.tbl_admin SET min_wallet_amount = min_wallet_amount + $3, last_recharge_amount_date = $1  WHERE id = $2`;
        },

        addDepositAmount: () => {
            return `UPDATE admin.tbl_admin SET deposit_amount = deposit_amount + $4, extra_charges=extra_charges - $3, last_deposit_amount_date = $1  WHERE id = $2`;            
        },

        addDepositRechargeAmount: () => {
            return `UPDATE admin.tbl_admin SET deposit_amount = deposit_amount + $4,  min_wallet_amount = min_wallet_amount + $3, last_deposit_amount_date = $1 ,last_recharge_amount_date  = $1  WHERE id = $2`;            
        },

        getUserForDipositRechargeList: () => {
            return `select
             ad.user_name,
             ad.mobile   ,
             ad.id ,
             ad.deposit_amount ,
             ad.min_wallet_amount,
             ad.address,
             ad.city_id,
             ad.state_id,
             ad.createdon_date,
             (select city_name  from masters.tbl_city tc where ad.city_id = tc.city_id  limit 1) ,
             (select state_name from masters.tbl_state ts where ts.state_id =ad.state_id limit 1)
            from admin.tbl_admin ad  
            where  (UPPER(TRIM(ad.user_name)) LIKE '%' || UPPER(TRIM($1)) ||'%'  OR $1 ='')
                       and (ad.mobile LIKE '%' || $2 ||'%'  OR  $2='');`;
        },
    },
    versionQueries: {

        
        insertVersion: () => {
            return `
            insert into admin.tbl_app_version_history(display_version ,actual_version ,min_supportable_version,remark ,version_apply_date ,createdon_date,createdby_login_user_id) 
                                    values($1,$2,$3,$4,$5,$6,$7)`;
        },

        updateOldVersion: () => {
            return `update admin.tbl_app_version_history set 
                               min_supportable_version = $1,
                               updatedon_date = $2`;
        },

        updateAppUserVersion: () => {
            return `update admin.tbl_app_version_history set display_version = $2 ,actual_version= $3 ,
                               min_supportable_version = $4,action_remark = $5,version_apply_date = $6 ,
                               updatedon_date = $7,updatedby_login_user_id = $8 where id = $1`;
        },

        getVersionHistory: () => {
            return `select id , display_version ,actual_version ,min_supportable_version,remark ,version_apply_date ,createdon_date,createdby_login_user_id, 
              updatedon_date ,action_remark ,updatedby_login_user_id  from  admin.tbl_app_version_history order by id desc `;
        },

        getVersionCurrent: () => {
            return `select id ,display_version ,actual_version ,min_supportable_version,remark ,version_apply_date ,createdon_date,createdby_login_user_id, 
              updatedon_date ,action_remark ,updatedby_login_user_id  from  admin.tbl_app_version_history order by id desc limit 1`;
        },

        getMiniSupportCurrentVersion: () => {
            return `select id ,display_version ,actual_version ,min_supportable_version,remark ,version_apply_date ,createdon_date,createdby_login_user_id, 
              updatedon_date ,action_remark ,updatedby_login_user_id  from  admin.tbl_app_version_history where min_supportable_version = true order by id desc limit 1`;
        },
    },
    adminQueries: {

        
        getAdminByEmailId: () => `select id, user_name, emailid, password, mobile, status_enum_id, user_type_enum_id, admin_auth_token from admin.tbl_admin where LOWER(TRIM(emailid)) = LOWER(TRIM($1)) and status_enum_id = 1 limit 1`,
        adminLogin: (emailId: string, password: string) => {
            return `select * from admin.fn_admin_loginn('${emailId}','${password}'); fetch all from admins`;
        },

        updateAdminPassword: (emailId: string, oldPassword: string, newPassword: string) => {
            return `select * from admin.fn_update_admin_password('${emailId}','${oldPassword}','${newPassword}');`;
        },
        resetpasswordEMailGeneration: (emailId: string, token: string) => {
            return `select * from admin.fn_reset_admin_passwords('${emailId}','${token}');`;
        },
        updateAdminPasswordByEmail: (password: string, token: string) => {
            return `select * from admin.fn_forgot_admin_password('${password}','${token}');`;
        },

        getAuthToken: (id: any) => {
            return `select admin_auth_token,user_auth_token from admin.tbl_admin where id = ${id} and status_enum_id=1`;
        },
        addAuthToken: () => {
            return `update  admin.tbl_admin  set admin_auth_token=$1 where id=$2 and status_enum_id=1`;
        },
        
        adminDashboardQueries: {
            getDashboardCard: () => {
                return ` 
                SELECT count(id) as count FROM  inventory.tbl_product_bike WHERE status_enum_id=1 and bike_booked_status=13
                  union all
                  SELECT count(id) as count FROM  inventory.tbl_product_bike WHERE status_enum_id=1 and bike_booked_status=14
                  union all
                  SELECT count(id) as count FROM  inventory.tbl_product_bike WHERE status_enum_id=1 and bike_booked_status=35
                    
                  union all
                  SELECT count(id) as count FROM  inventory.tbl_product_bike  WHERE status_enum_id=1
                  union all
                  SELECT coalesce(sum(total_ride_amount),0) as count FROM  admin.tbl_ride_booking 
                  union all
                  
              (select  count(tld.lock_number)
              from   inventory.tbl_lock_detail  tld
			   inner join inventory.tbl_product_bike pb on
			   pb.lock_id =tld.id and pb.status_enum_id =1
			   where registartion_status = true and 
                         (CASE WHEN trim(coalesce(tld.battery,'')) ~ '^[0-9]+(\.[0-9]+)?$' THEN trim(tld.battery)::numeric ELSE 0 END) between 0 and 20) 
             
              union all
             (select  count(tld.lock_number)
              from  inventory.tbl_lock_detail  tld 
			  inner join inventory.tbl_product_bike pb on
			   pb.lock_id =tld.id and pb.status_enum_id =1
			  where registartion_status = true and
                         (CASE WHEN trim(coalesce(tld.battery,'')) ~ '^[0-9]+(\.[0-9]+)?$' THEN trim(tld.battery)::numeric ELSE 0 END) >20 and (CASE WHEN trim(coalesce(tld.battery,'')) ~ '^[0-9]+(\.[0-9]+)?$' THEN trim(tld.battery)::numeric ELSE 0 END) <=50) 
            union all
            (select  count(tld.lock_number)
              from   inventory.tbl_lock_detail  tld 
			 inner join inventory.tbl_product_bike pb on
			   pb.lock_id =tld.id and pb.status_enum_id =1
			 where registartion_status = true and
                         (CASE WHEN trim(coalesce(tld.battery,'')) ~ '^[0-9]+(\.[0-9]+)?$' THEN trim(tld.battery)::numeric ELSE 0 END) >50)
             union all 
             (select  count(id)
             from inventory.tbl_product_bike WHERE status_enum_id=1 and geofence_inout_enum_id = 63 limit 1)
             union all 
             (select  count(tld.lock_number)
             from   inventory.tbl_lock_detail  tld 
            inner join inventory.tbl_product_bike pb on
              pb.lock_id =tld.id and pb.status_enum_id =1
            where tld.registartion_status = true and ( tld.power_on_off_status_enum_id = '96' OR tld.device_lock_and_unlock_status = '1' ) limit 1) 
            union all 
            (select  count(tld.lock_number)
             from   inventory.tbl_lock_detail  tld 
            inner join inventory.tbl_product_bike pb on
              pb.lock_id =tld.id and pb.status_enum_id =1 and pb.bike_booked_status=14
            where tld.registartion_status = true and ( tld.power_on_off_status_enum_id = '96' OR tld.device_lock_and_unlock_status = '1' ) limit 1)
            union all 
            (select count(id)  FROM admin.tbl_withdraw_transaction_details where withdraw_request_status_enum_id =10)
			`;
            },
            addDevice: () => {
                return `select * from  shop.fn_add_update_test_device_detail($1,$2,$3,$4,$5)`;
            },
            checkDuplicateDevice: () => {
                return `select id from shop.tbl_device_test where  UPPER(TRIM(name))=UPPER(TRIM($1)) AND COALESCE($1,'')!='' ;`;
            },
            addDeviceIdAndInstruction: () => {
                return `Insert INTO shop.tbl_device_test(device_id,instruction_id)
                    VALUES($1,$2)`;
            },
            getDeviceInstructionUsingDeviceId: () => {
                return `select  id,lock_number as device_id, instruction_id from inventory.tbl_lock_detail WHERE lock_number =$1`;
            },

            getDeviceLockAndLightInstructionDeviceId: () => { return `select 
             lockd.lock_number as device_id,
             lockd.id,
             lockd.device_lock_and_unlock_status ,
             (select name from masters.tbl_device_lock_status where id = lockd.device_lock_and_unlock_status) lock_status ,
             lockd.instruction_id ,
             (select name from masters.tbl_device_instractions where id = lockd.instruction_id)  instruction_name ,		   
             lockd.device_light_status_enum_id ,
             (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =lockd.device_light_status_enum_id)as deveice_light_status,
             lockd.device_light_instruction_enum_id , 
             (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =lockd.device_light_instruction_enum_id)as device_light_instruction,
		     lockd.beep_instruction_enum_id  ,
			 (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =lockd.beep_instruction_enum_id)as beep_instruction,
	         lockd.beep_status_enum_id  ,
			 (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =lockd.beep_status_enum_id)as beep_status
			 
            from  inventory.tbl_lock_detail  lockd
            WHERE lockd.lock_number =$1  `},
            getDeviceLastTime: () => {
                return `select enum_key::int from public.tbl_enum   WHERE enum_id= 25`;
            },
            setDeviceLastTimeAndConnectionQuery: () => {
                return `update inventory.tbl_lock_detail set device_last_request_time = $1, deveice_state_enum_id = $2 where id = $3`
            },
        
            setInstructionToLockUnlockDevice: () => {
                return`UPDATE inventory.tbl_lock_detail
                SET   instruction_id=$1 ,
                lastupdateddateforlockunlockinstruction =$3
                WHERE lock_number = $2;`;
            },
            updateDeviceStateTime: () => {
                return`update inventory.tbl_lock_detail set deveice_state_enum_id =24 
                where $1 >  (device_last_request_time  + (coalesce((select enum_key::integer from public.tbl_enum   WHERE enum_id= 49 limit 1),0) * interval '1 minute'))
                and deveice_state_enum_id= 23`;
            },

            insertSheduletime: () => {
                return `insert into  admin.tbl_schedule_time(createdon_date)values($1)RETURNING id `;
            },

            updateSheduletime: () => {
                return `UPDATE  admin.tbl_schedule_time set update_date =$1 where id = $2 `;
            },
            UnlockDevice: () => {
                return `UPDATE inventory.tbl_lock_detail
                SET  device_lock_and_unlock_status=$1, instruction_id=$2 ,
                lastupdateddateforlockunlock =$4
                WHERE lock_number = $3;`;
            },

            deviceLockUnlockForthirdParty: () => {
                return `UPDATE inventory.tbl_lock_detail
                SET  device_lock_and_unlock_status=$1,
                lastupdateddateforlockunlock =$2,
                lastdevicerequesttime =$2,
                device_lock_unlock_communication_enum_id = $4
                WHERE id = $3;`;
            },

           powerOnOffForthirdParty: () => {
                return `UPDATE inventory.tbl_lock_detail
                SET  power_on_off_status_enum_id=$1,
                lastupdateddateforpoweronoff =$2 , 
                lastdevicerequesttime = $2
                WHERE id = $3;`;
            },

            lockDevice: () => {
                return `UPDATE inventory.tbl_lock_detail
                SET  device_lock_and_unlock_status=$1, instruction_id=$2,
                lastupdateddateforlockunlock =$4
                WHERE lock_number = $3;`;
            },

            clearInstructionForLockUnlockDeviceQ: () => {
                return `UPDATE inventory.tbl_lock_detail
                SET   instruction_id=$1                
                WHERE id = $2;`;
            },

            clearInstructionForLightOnOffDeviceQuery: () => {
                return `UPDATE inventory.tbl_lock_detail
                SET   device_light_instruction_enum_id=$1                
                WHERE id = $2;`;
            },
            changeDeviceRegistrationStatus: () => {
                return `UPDATE  inventory.tbl_lock_detail set registartion_status = $1 , instruction_id = 4 where lock_number=$2`;
            },
            updateDeviceInformation: () => {
                return `UPDATE inventory.tbl_lock_detail
                SET  location=$1, latitude=$2,
                 longitude=$3, altitude=$4, speed=$5, battery=$6, internal_batt_v=$7, external_batt_v=$8,updatedon_date=$9
                WHERE lock_number=$10;`;
            },

            updateDeviceInformationPart1: () => {
                return `UPDATE inventory.tbl_lock_detail
                SET  latitude=$1, longitude=$2,lastupdateddateforlatlong =$3,last_distance_in_meters = $5,
                total_distance_in_meters = coalesce(total_distance_in_meters,0) + $5
                WHERE lock_number=$4;`;
            },
            updateDeviceInternalBattery: () => {
                return `UPDATE inventory.tbl_lock_detail
                SET   internal_batt_v=$1, lastupdateddateforinternalbatteryvolt=$2
                WHERE lock_number=$3;`;
            },

            updateDeviceExternalBattery: () => {
                return `UPDATE inventory.tbl_lock_detail
                SET   external_batt_v=$1,lastupdateddateforexternalbatteryvolt=$2
                WHERE lock_number=$3;`;
            },

            updateDeviceSpeed: () => {
                return `UPDATE inventory.tbl_lock_detail SET speed=$1, lastupdateddateforspeed =$2 WHERE lock_number=$3;`;
            },

            updateDeviceAltitude: () => {
                return `UPDATE inventory.tbl_lock_detail
                SET   altitude=$1,lastupdateddateforaltitude=$2
                WHERE lock_number=$3;`;
            },

            updateDeviceBetterPersentage:() => {
                return `UPDATE inventory.tbl_lock_detail SET battery =$1 ,lastupdateddateforbatterypercentage=$2 WHERE lock_number=$3;`;
            },

            updateDeviceLocations: () => {
                return `UPDATE inventory.tbl_lock_detail
                SET   location=$1, updatedon_date=$2
                WHERE lock_number=$3;`;
            },
            
            updateLockDetailWithMEotherParamter: () => {
                return `UPDATE inventory.tbl_lock_detail
                SET                   
                                                                           
                me_disabled =$2, 

                me_statesince_date =$3,                                
                me_device_datetime =$4,

                me_fix_datetime =$5,
                me_isvalid_device_packet= $6 ,
                deveice_state_enum_id =$7 ,
                device_last_request_time =$8 ,
                power_on_off_status_enum_id = $9 ,
                lastupdateddateforpoweronoff = $8                 
                WHERE lock_number=$1;`;
            },
            deviceRegistration: () => {
                return `INSERT INTO shop.tbl_device_test(
	                     name, registration_number,  latitude, longitude, createdon_date)
	                           VALUES ($1,$2,$3,$4,$5) RETURNING id;`;
            },
            deviceRegistration2: () => {
                return `INSERT INTO shop.tbl_device_test(
	                     name, createdon_date)
	                           VALUES ($1,$2) RETURNING id;`;
            },
            deviceRegistration3: () => {
                return ` UPDATE inventory.tbl_lock_detail SET  name=$1, registration_number=$2, imei_number=$3, serial_number=$4, odometer=$5, run_time=$6, chassis_number=$7, date_of_manufacture=$8, date_of_service=$9  ,createdon_date=$10 ,device_lock_and_unlock_status=2 WHERE lock_number=$11`;
                
            },

            deviceRegistrationByAdmin: () => {
                return ` UPDATE inventory.tbl_lock_detail SET   registartion_status=$2 WHERE id=$1`;                
            },

            deviceRegistration4: () => {
                return ` UPDATE inventory.tbl_lock_detail SET   registration_number=$1, serial_number=$2,chassis_number=$3, date_of_manufacture=$4  ,createdon_date=$5 ,device_lock_and_unlock_status=2 WHERE lock_number=$6`;
                
            },
            deviceDelete: () => {
                return `DELETE FROM inventory.tbl_lock_detail  WHERE name = $1`;
            },

            getDeviceDetail: () => {
                return `select  dev.id ,dev.name ,dev.location ,dev.latitude , dev.longitude ,
                dev.altitude ,  dev.speed ,  dev.battery ,  dev.internal_batt_v ,  dev.external_batt_v ,  dev.device_status 
                from shop.tbl_device_test dev
                 where  (dev.name = $1  OR $1 ='')  
                 order by dev.id ;
                 ;`;
            },
            lockAndUnlockDevice: () => {
                return `select * from  shop.fn_device_lock_unlock($1,$2)`;
            },
            addUpdateZone: () => {
                return `select * from masters.fn_add_update_zone_details($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`;
            },
            getZone: () => {
                return `                
                SELECT tblzone.id, tblzone.name, tblzone.latitude, tblzone.longitude, tblzone.zone_size, tblzone.zone_capacity, tblzone.zone_address,                                 
                -- (select tblstatus.state_name from masters.tbl_state tblstatus where tblstatus.state_id = tblzone.state_id) as state_name,
                 ta.map_city_id as city_id,
                 tblzone.area_id,
                 ta.name as area_name ,
                 (select tblstatus.map_city_name from masters.tbl_map_city tblstatus where tblstatus.map_city_id = ta.map_city_id) as city_name,
                 tblzone.status_enum_id,
                 
                 (select s.map_state_id from masters.tbl_map_state s where  s.map_state_id =cities.map_state_id) state_id,
                 (select s.map_state_name from masters.tbl_map_state s where  s.map_state_id =cities.map_state_id) state_name,
                 (select tblstatus.enum_key from tbl_enum tblstatus where tblstatus.enum_id = tblzone.status_enum_id) as status_name,
                 tblzone.remarks, 
                 tblzone.action_remarks, 
                 tblzone.createdon_date, 
                 tblzone.createdby_login_user_id, 
                 (select tblstatus.user_name from admin.tbl_admin tblstatus where tblstatus.id = tblzone.createdby_login_user_id) as created_by_user_name,
                 tblzone.createdby_user_type_enum_id, 
                 (select tblstatus.enum_key from tbl_enum tblstatus where tblstatus.enum_id = tblzone.createdby_user_type_enum_id) as created_by_user_type_name,
                 tblzone.updated_login_user_id, 
                 (select tblstatus.user_name from admin.tbl_admin tblstatus where tblstatus.id = tblzone.updated_login_user_id) as updated_login_user_name,
                 tblzone.updatedon_date,
                 tblzone.updatedby_user_type_enum_id,
                 (select tblstatus.enum_key from tbl_enum tblstatus where tblstatus.enum_id = tblzone.updatedby_user_type_enum_id) as updated_by_user_type_name,
                 ta.area_type_enum_id,
            (select tblstatus.enum_key from tbl_enum tblstatus where tblstatus.enum_id = ta.area_type_enum_id) as area_enum_type_name

                 FROM masters.tbl_zone_detail tblzone                                 
                  inner join masters.tbl_area ta  on
                  tblzone.area_id = ta.id
                 inner join masters.tbl_map_city
                 cities on  cities.map_city_id =ta.map_city_id                 
                 WHERE  (tblzone.id = $1 OR $1 = 0) AND
                 (tblzone.area_id = $3 OR $3 = 0) AND
                (tblzone.status_enum_id = $2 OR $2 = 0);`;
            },
            getZoneList: () => {
                return `SELECT tblzone.id as zoneId, tblzone.name  from masters.tbl_zone_detail tblzone 
                WHERE   (tblzone.status_enum_id =1)`;
            },
            checkRegistrationStatus: () => {
                return `select * from inventory.tbl_lock_detail WHERE  lock_number=$1`;
            },

            checkLastReuestTimeForDevice: () => {
                return `select device_last_request_time  from inventory.tbl_lock_detail  where lock_number = $1`;
            },
           deviceInternalCallingTimeQ: () => {
                return `select enum_key::int from public.tbl_enum where enum_id = 95`;
            },
            getProduceBikeBatteryStatusLessThenTwenty: () => {
                return `  select  tpb.id,
                ride.id as ride_id ,
                ride.ride_booking_no,
                usr.user_name ,
                usr.mobile,
                tpb.bike_name,
                                tld.deveice_state_enum_id ,
                                tld.lastupdateddateforbatterypercentage,
                                coalesce(tld.device_last_request_time, tld.lastdevicerequesttime) as device_last_request_time,
                                (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tld.deveice_state_enum_id ) as deveice_status,
                                tld.battery ,tld.internal_batt_v, tld.external_batt_v,
                                tld.lock_number,tld.latitude, tld.longitude, 
                                tpb.bike_booked_status,
                                (select tblenum.enum_key from public.tbl_enum tblenum where tblenum.enum_id=tpb.bike_booked_status) as bike_booked_status_name,
                                (select tbzd.name from masters.tbl_zone_detail tbzd where tbzd.id=tpb.zone_id) as zone_name,
                              
                                tld.device_light_status_enum_id ,
                           (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tld.device_light_status_enum_id)as deveice_light_status,
                           tld.device_light_instruction_enum_id , 
                          (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tld.device_light_instruction_enum_id)as device_light_instruction ,
                          tld.device_lock_and_unlock_status,
                           (select dls.name from  masters.tbl_device_lock_status dls where  dls.id =tld.device_lock_and_unlock_status ) as device_lock_unlock_status ,
                
                
			            tld.beep_instruction_enum_id , 
                          (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tld.beep_instruction_enum_id)as beep_instruction_enum_name ,
                          tld.beep_status_enum_id,
                          (select tenum.enum_key from  public.tbl_enum tenum  where  tenum.enum_id =tld.beep_status_enum_id ) as beep_status_enum_name ,
                          tld.instruction_id ,
                          (select display_name from masters.tbl_device_instractions where id = tld.instruction_id)  instruction_name ,
                          tpb.geofence_inout_enum_id,
             (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tpb.geofence_inout_enum_id)as geofence_inout_name  ,
             tld.power_on_off_status_enum_id ,
           (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tld.power_on_off_status_enum_id)as power_on_off_status 
 


                        
				
                                from  inventory.tbl_lock_detail  tld   
                                inner join  inventory.tbl_product_bike tpb  on
                                tpb.lock_id = tld.id 
                                left join admin.tbl_ride_booking  ride
                                 on ride.vehicle_lock_id = tpb.id
                                 and  bike_rideing_status= 16
                                left join admin.tbl_admin usr on 
                                usr.id = ride.user_id 
								  left join masters.tbl_zone_detail zd on
	  tpb.zone_id = zd.id 
	  left join masters.tbl_area ar on 
	  zd.area_id = ar.id
	  left join masters.tbl_map_city cities on   
      cities.map_city_id=ar.map_city_id 
	  left join masters.tbl_map_state states on
      states.map_state_id =cities.map_state_id
	  left join masters.tbl_map_country countrys on
	  countrys.map_country_id =states.map_country_id 
     where tpb.status_enum_id=1 and ( UPPER(TRIM(countrys.map_country_name)) = UPPER(TRIM($1))  OR $1='' ) and 
	  ( UPPER(TRIM(states.map_state_name)) =  UPPER(TRIM($2)) OR $2 ='' ) and
	  ( UPPER(TRIM(cities.map_city_name)) = UPPER(TRIM($3)) OR $3='' OR   UPPER(TRIM(cities.user_city_name)) = UPPER(TRIM($3))) 
                             
                                group by  tpb.id,tld.battery ,tld.internal_batt_v, tld.external_batt_v,
                                tld.lock_number,tld.latitude, tld.longitude, tpb.bike_booked_status,
                                tld.device_light_status_enum_id  ,tld.device_light_instruction_enum_id ,tld.device_lock_and_unlock_status,
                                tld.deveice_state_enum_id
                                ,tld.device_last_request_time ,tld.lastupdateddateforbatterypercentage,
                                ride.id,usr.id,tld.beep_instruction_enum_id ,  tld.beep_status_enum_id,tld.instruction_id ,tld.power_on_off_status_enum_id
                having CAST (coalesce(tld.battery,'0' )AS numeric)  <= 20`;
            },
            getProduceBikeBatteryStatusGraterThenTwentyAndLessThenFifty: () => {
                return `   select  tpb.id,
                ride.id as ride_id ,
                ride.ride_booking_no,
                usr.user_name ,
                usr.mobile,
                tpb.bike_name,
                                tld.deveice_state_enum_id ,
                                tld.lastupdateddateforbatterypercentage,
                                coalesce(tld.device_last_request_time, tld.lastdevicerequesttime) as device_last_request_time,
                                (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tld.deveice_state_enum_id ) as deveice_status,
                                tld.battery ,tld.internal_batt_v, tld.external_batt_v,
                                tld.lock_number,tld.latitude, tld.longitude, tpb.bike_booked_status,
                                (select tblenum.enum_key from public.tbl_enum tblenum where tblenum.enum_id=tpb.bike_booked_status) as bike_booked_status_name,
                                (select tbzd.name from masters.tbl_zone_detail tbzd where tbzd.id=tpb.zone_id) as zone_name,
                              
                                tld.device_light_status_enum_id ,
                           (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tld.device_light_status_enum_id)as deveice_light_status,
                           tld.device_light_instruction_enum_id , 
                          (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tld.device_light_instruction_enum_id)as device_light_instruction ,
                          tld.device_lock_and_unlock_status,
                           (select dls.name from  masters.tbl_device_lock_status dls where  dls.id =tld.device_lock_and_unlock_status ) as device_lock_unlock_status ,
                
                
			            tld.beep_instruction_enum_id , 
                          (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tld.beep_instruction_enum_id)as beep_instruction_enum_name ,
                          tld.beep_status_enum_id,
                          (select tenum.enum_key from  public.tbl_enum tenum  where  tenum.enum_id =tld.beep_status_enum_id ) as beep_status_enum_name ,
                          tld.instruction_id ,
                          (select display_name from masters.tbl_device_instractions where id = tld.instruction_id)  instruction_name ,
                          tpb.geofence_inout_enum_id,
                          (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tpb.geofence_inout_enum_id)as geofence_inout_name  ,
                          tld.power_on_off_status_enum_id ,
                          (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tld.power_on_off_status_enum_id)as power_on_off_status 
                                                                    				
                                from  inventory.tbl_lock_detail  tld   
                                inner join  inventory.tbl_product_bike tpb  on
                                tpb.lock_id = tld.id 
                                left join admin.tbl_ride_booking  ride
                                 on ride.vehicle_lock_id = tpb.id
                                 and  bike_rideing_status= 16
                                left join admin.tbl_admin usr on 
                                usr.id = ride.user_id 
								  left join masters.tbl_zone_detail zd on
	  tpb.zone_id = zd.id 
	  left join masters.tbl_area ar on 
	  zd.area_id = ar.id
	  left join masters.tbl_map_city cities on   
      cities.map_city_id=ar.map_city_id 
	  left join masters.tbl_map_state states on
      states.map_state_id =cities.map_state_id
	  left join masters.tbl_map_country countrys on
	  countrys.map_country_id =states.map_country_id 
     where  tpb.status_enum_id=1 and ( UPPER(TRIM(countrys.map_country_name)) = UPPER(TRIM($1))  OR $1='' ) and 
	  ( UPPER(TRIM(states.map_state_name)) =  UPPER(TRIM($2)) OR $2 ='' ) and
	  ( UPPER(TRIM(cities.map_city_name)) = UPPER(TRIM($3)) OR $3='' OR   UPPER(TRIM(cities.user_city_name)) = UPPER(TRIM($3))) 
                             
                                
                                group by  tpb.id,tld.battery ,tld.internal_batt_v, tld.external_batt_v,
                                tld.lock_number,tld.latitude, tld.longitude, tpb.bike_booked_status,
                                tld.device_light_status_enum_id  ,tld.device_light_instruction_enum_id ,tld.device_lock_and_unlock_status,
                                tld.deveice_state_enum_id
                                ,tld.device_last_request_time ,tld.lastupdateddateforbatterypercentage,
                                ride.id,usr.id,tld.beep_instruction_enum_id ,  tld.beep_status_enum_id,tld.instruction_id ,tld.power_on_off_status_enum_id
                            having  CAST(coalesce(tld.battery,'0' )AS numeric) > 20 and CAST (coalesce(tld.battery,'0' )AS numeric) <= 50
            `;
            },
            getProduceBikeBatteryStatusGraterThenFifty: () => {
                return `
                select  tpb.id,
                ride.id as ride_id ,
                ride.ride_booking_no,
                usr.user_name ,
                usr.mobile,
                tpb.bike_name,
                                tld.deveice_state_enum_id ,
                                tld.lastupdateddateforbatterypercentage,
                                coalesce(tld.device_last_request_time, tld.lastdevicerequesttime) as device_last_request_time,
                                (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tld.deveice_state_enum_id ) as deveice_status,
                                tld.battery ,tld.internal_batt_v, tld.external_batt_v,
                                tld.lock_number,tld.latitude, tld.longitude, tpb.bike_booked_status,
                                (select tblenum.enum_key from public.tbl_enum tblenum where tblenum.enum_id=tpb.bike_booked_status) as bike_booked_status_name,
                                (select tbzd.name from masters.tbl_zone_detail tbzd where tbzd.id=tpb.zone_id) as zone_name,
                              
                                tld.device_light_status_enum_id ,
                           (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tld.device_light_status_enum_id)as deveice_light_status,
                           tld.device_light_instruction_enum_id , 
                          (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tld.device_light_instruction_enum_id)as device_light_instruction ,
                          tld.device_lock_and_unlock_status,
                           (select dls.name from  masters.tbl_device_lock_status dls where  dls.id =tld.device_lock_and_unlock_status ) as device_lock_unlock_status ,
                
                
			            tld.beep_instruction_enum_id , 
                          (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tld.beep_instruction_enum_id)as beep_instruction_enum_name ,
                          tld.beep_status_enum_id,
                          (select tenum.enum_key from  public.tbl_enum tenum  where  tenum.enum_id =tld.beep_status_enum_id ) as beep_status_enum_name ,
                          tld.instruction_id ,
                          (select display_name from masters.tbl_device_instractions where id = tld.instruction_id)  instruction_name ,
                          tpb.geofence_inout_enum_id,
                          (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tpb.geofence_inout_enum_id)as geofence_inout_name ,
                          tld.power_on_off_status_enum_id ,
                          (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tld.power_on_off_status_enum_id)as power_on_off_status 
                
                                         
                                from  inventory.tbl_lock_detail  tld   
                                inner join  inventory.tbl_product_bike tpb  on
                                tpb.lock_id = tld.id 
                                left join admin.tbl_ride_booking  ride
                                 on ride.vehicle_lock_id = tpb.id
                                 and  bike_rideing_status= 16
                                left join admin.tbl_admin usr on 
                                usr.id = ride.user_id 
								  left join masters.tbl_zone_detail zd on
	  tpb.zone_id = zd.id 
	  left join masters.tbl_area ar on 
	  zd.area_id = ar.id
	  left join masters.tbl_map_city cities on   
      cities.map_city_id=ar.map_city_id 
	  left join masters.tbl_map_state states on
      states.map_state_id =cities.map_state_id
	  left join masters.tbl_map_country countrys on
	  countrys.map_country_id =states.map_country_id 
     where  tpb.status_enum_id=1 and ( UPPER(TRIM(countrys.map_country_name)) = UPPER(TRIM($1))  OR $1='' ) and 
	  ( UPPER(TRIM(states.map_state_name)) =  UPPER(TRIM($2)) OR $2 ='' ) and
	  ( UPPER(TRIM(cities.map_city_name)) = UPPER(TRIM($3)) OR $3='' OR   UPPER(TRIM(cities.user_city_name)) = UPPER(TRIM($3))) 
                             
                                
                                group by  tpb.id,tld.battery ,tld.internal_batt_v, tld.external_batt_v,
                                tld.lock_number,tld.latitude, tld.longitude, tpb.bike_booked_status,
                                tld.device_light_status_enum_id  ,tld.device_light_instruction_enum_id ,tld.device_lock_and_unlock_status,
                                tld.deveice_state_enum_id
                                ,tld.device_last_request_time ,tld.lastupdateddateforbatterypercentage,
                                ride.id,usr.id,tld.beep_instruction_enum_id ,  tld.beep_status_enum_id,tld.instruction_id ,tld.power_on_off_status_enum_id
                                 having  CAST(coalesce(tld.battery,'0' )AS numeric) > 50`;
            },
            changesMinimumWalletBalance: () => {
                return `UPDATE public.tbl_enum
                SET   enum_key=$2, enum_display_value=$3 WHERE enum_id = $1;`;
            },
            addMinimumWalletBalanceHistory: () => {
                return `INSERT INTO admin.tbl_minimum_wallet_amount_update_history(
                    amount, status_enum_id, createdon_date, createdby_login_user_id, createdby_user_type_enum_id, updated_login_user_id, updatedon_date, updatedby_user_type_enum_id,add_amount_for)
                   VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9);`;
            },
            getMinimumWalletBalanceHistory: () => {
                return `SELECT tblmwauh.id,
                tblmwauh.amount,
                tblmwauh.status_enum_id,
                (select tblstatus.enum_key from tbl_enum tblstatus where tblstatus.enum_id = tblmwauh.status_enum_id) as status_name,
                tblmwauh.remarks, tblmwauh.action_remarks, tblmwauh.createdon_date,tblmwauh.createdon_date, 
                            tblmwauh.createdby_login_user_id, 
                            (select tblstatus.user_name from admin.tbl_admin tblstatus where tblstatus.id = tblmwauh.createdby_login_user_id) as created_by_user_name,
                            tblmwauh.createdby_user_type_enum_id, 
                            (select tblstatus.enum_key from tbl_enum tblstatus where tblstatus.enum_id = tblmwauh.createdby_user_type_enum_id) as created_by_user_type_name,
                            tblmwauh.updated_login_user_id, 
                            (select tblstatus.user_name from admin.tbl_admin tblstatus where tblstatus.id = tblmwauh.updated_login_user_id) as updated_login_user_name,
                            tblmwauh.updatedon_date,
                            tblmwauh.updatedby_user_type_enum_id,
                            (select tblstatus.enum_key from tbl_enum tblstatus where tblstatus.enum_id = tblmwauh.updatedby_user_type_enum_id) as updated_by_user_type_name ,
                            tblmwauh.add_amount_for ,
                            (select tblstatus.enum_type_name from tbl_enum tblstatus where tblstatus.enum_id = tblmwauh.add_amount_for) as add_amount_for_name 
                    FROM admin.tbl_minimum_wallet_amount_update_history tblmwauh 
                    where (tblmwauh.add_amount_for = $1 or $1=0)
                    order by id desc; `;
            },
                               
        
            setDeviceLightOnOffInstructionQuery: () => {
                return `UPDATE inventory.tbl_lock_detail SET device_light_instruction_enum_id=$1 ,lastupdateddateforlightonoffinstruction =$3 WHERE id=$2`;
            }, 

            lightOnOffDeviecQuery: () => {
                return `UPDATE inventory.tbl_lock_detail
                SET  device_light_status_enum_id=$1, device_light_instruction_enum_id=$2,lastupdateddateforlightonoff =$4
                WHERE id = $3;`;
            },          

            insertDeviceLightInstructionsQuery:()=>
            {
                return `insert into  admin.tbl_add_device_light_instruction(lock_id,ride_booking_id,
                    instruction_device_light_instruction_enum_id,
                    status_enum_id,createdon_date,createdby_login_user_id)
                    values($1,$2,$3,$4,$5,$6) RETURNING id;`
            },
            addDeviceLightInformationslogQuery: () => {
                return `INSERT INTO admin.tbl_add_device_information_log(
                lock_id, 
                device_id,
                ride_booking_id,
                device_light_status_enum_id ,
                device_light_instruction_enum_id,
                status_enum_id, 
                remarks, 
                createdon_date, 
                createdby_login_user_id ,
                instruction_id ,
                device_lock_and_unlock_status,
                beep_instruction_enum_id,
                beep_status_enum_id ,
                outside_geo_fence_latitude ,
                outside_geo_fence_longitude ,
                mapcity_id ,
                area_id    ,
                device_lock_unlock_communication_enum_id  ,
                power_status_enum_id ,
                power_instruction_enum_id  ,
                action_remarks,
                previous_latitude,previous_longitude,distance_in_meters     
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18, $19,$20,$21,$22,$23,$24) RETURNING id;`;
            },

            getRideingIdByLockNumber: () => {
                return `select id , user_id  from admin.tbl_ride_booking 
                 where vehicle_lock_id = $1
                 and  bike_rideing_status= 16
                order by id desc limit 1 `;
            },

            getLockUnLockCommods: () => {
                return `select id,name,commandid,isqueuing ,timeout  from masters.tbl_thingsup_lock_unlock_commands  where id = $1 `;
            },

            updateAreaCityInLockDetail: () => {
                return`update inventory.tbl_lock_detail set area_id=$1 ,map_city_id =$2 where id=$3`
            },

            addRidebookingBeepOnLatLogJsonQ:()=>
            {
               return  `update admin.tbl_ride_booking  
                        set beepon_latitude_longitude_json = beepon_latitude_longitude_json::jsonb || $1 
                        , area_id =$3,map_city_id =$4
                        where id = $2`
            },
   
            addRidebookingBeepOffLatLogJsonQ:()=>
            {
               return  `update admin.tbl_ride_booking  
               set beepoff_latitude_longitude_json = beepoff_latitude_longitude_json::jsonb || $1
               where id = $2`
            },
            // getLockNumber: () => {
            //     return `select id , user_id from admin.tbl_ride_booking 
            //      where vehicle_lock_id = $1
            //      and  bike_rideing_status= 16
            //     order by id desc limit 1 `;
            // },

           addDeviceLockCountQuery: () => {
                return `update admin.tbl_ride_booking  set device_lock_count = device_lock_count+$1
                         where id = $2`;
            },
            addDeviceUnLockCounttQuery: () => {
                return `update admin.tbl_ride_booking  set device_unlock_count = device_unlock_count + $1
                where id = $2`;
            },

            addLightOnCountQuery: () => {
                return `update admin.tbl_ride_booking  set light_on_count = light_on_count + $1
                         where id = $2`;
            },
            addLightOffCountQuery: () => {
                return `update admin.tbl_ride_booking  set light_off_count = light_off_count + $1
                where id = $2`;
            },

             getLockIdByLockNumber:()=>
            {
                return `select latitude,longitude,id ,device_light_instruction_enum_id,device_light_status_enum_id, beep_instruction_enum_id,beep_status_enum_id ,instruction_id from inventory.tbl_lock_detail WHERE lock_number = $1`
            },

            getBikeStatusAndZone:()=>
            {
                return `select id,bike_booked_status,zone_id from inventory.tbl_product_bike where lock_id =$1 and status_enum_id ='1' limit 1`
            },

            
            getLockStatus:()=>
            {
                return `select id , name from masters.tbl_device_lock_status`
            },   
            
            
            setDeviceBeepOnOffInstructionQuery: () => {
                return `UPDATE inventory.tbl_lock_detail SET beep_instruction_enum_id=$1 ,lastupdateddateforbeeponoofinstruction=$3 WHERE id=$2`;
            }, 

            setBikeGeoInOutQuery: () => {
                return `UPDATE inventory.tbl_product_bike SET geofence_inout_enum_id=$1 WHERE id=$2`;
            }, 

            insertBeepInstructionsQuery:()=>
            {
                return `insert into  admin.tbl_add_device_beep_instruction(lock_id,ride_booking_id,
                    beep_instruction_enum_id,
                    status_enum_id,createdon_date,createdby_login_user_id,outside_geo_fence_latitude ,outside_geo_fence_longitude,
                    map_city_id ,area_id)
                    values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id;`
            },

            beepOnOffDeviecQuery: () => {
                return `UPDATE inventory.tbl_lock_detail
                SET  beep_status_enum_id=$1, beep_instruction_enum_id=$2,lastupdateddateforbeeponoff=$4
                WHERE id = $3;`;
            },          

            addBeepOffCountQuery: () => {
                return `update admin.tbl_ride_booking  set beep_off_count = beep_off_count + $1
                where id = $2`;
            },

            addBeepOnCountQuery: () => {
                return `update admin.tbl_ride_booking  set beep_on_count = beep_on_count + $1
                where id = $2`;
            },
        }
    },

    enumQueries: {
        EnumDetail: (enum_type: string) => {
            return `select * from public.fn_get_enum_list('${enum_type}'); fetch all from enum`;
        },
        getUnitDetails: () => {
            return `SELECT tblunit.id,  tblunit.unit_name,
            tblunit.status_enum_id, 
            (select tblstatus.enum_key from tbl_enum tblstatus where tblstatus.enum_id = tblunit.status_enum_id) as status_name,
            tblunit.remarks, 
            tblunit.action_remarks, 
            tblunit.createdon_date, 
            tblunit.createdby_login_user_id, 
            (select tblstatus.user_name from admin.tbl_admin tblstatus where tblstatus.id = tblunit.createdby_login_user_id) as created_by_user_name,
            tblunit.createdby_user_type_enum_id, 
            (select tblstatus.enum_key from tbl_enum tblstatus where tblstatus.enum_id = tblunit.createdby_user_type_enum_id) as created_by_user_type_name,
            tblunit.updated_login_user_id, 
            (select tblstatus.user_name from admin.tbl_admin tblstatus where tblstatus.id = tblunit.updated_login_user_id) as updated_login_user_name,
            tblunit.updatedon_date,
            tblunit.updatedby_user_type_enum_id,
            (select tblstatus.enum_key from tbl_enum tblstatus where tblstatus.enum_id = tblunit.updatedby_user_type_enum_id) as updated_by_user_type_name
            FROM masters.tbl_unit tblunit
            WHERE (tblunit.id = $1 OR $1 = 0) AND (tblunit.status_enum_id = $2 OR $2 = 0)
             order by tblunit.unit_name asc;`;
        },
        getVehicleModelDetails: () => {
            return `SELECT tblvehmod.id,
           -- (select  tblProdBike.id  from  inventory.tbl_product_bike tblProdBike where tblProdBike.model_id=$1 and  tblProdBike.uid_id=$2 and  tblProdBike.lock_id=$3) as bike_id
             tblvehmod.vehicle_type,
            (select tblstatus.name from masters.tbl_vehicle_type tblstatus where tblstatus.id = tblvehmod.vehicle_type) as vehicle_type_name,
            tblvehmod.model_name, tblvehmod.brackes_type, tblvehmod.brand_name, tblvehmod.frame_type, tblvehmod.tiers_size,tblvehmod.lenght,tblvehmod.lenght_unit,
            tblvehmod.width,  tblvehmod.width_unit, tblvehmod.weight, tblvehmod.weight_unit, tblvehmod.height,  tblvehmod.height_unit,  tblvehmod.status_enum_id, 
            (select tblstatus.enum_key from tbl_enum tblstatus where tblstatus.enum_id = tblvehmod.status_enum_id) as status_name,
            tblvehmod.remarks, 
            tblvehmod.action_remarks, 
            tblvehmod.createdon_date, 
            tblvehmod.createdby_login_user_id, 
            (select tblstatus.user_name from admin.tbl_admin tblstatus where tblstatus.id = tblvehmod.createdby_login_user_id) as created_by_user_name,
            tblvehmod.createdby_user_type_enum_id, 
            (select tblstatus.enum_key from tbl_enum tblstatus where tblstatus.enum_id = tblvehmod.createdby_user_type_enum_id) as created_by_user_type_name,
            tblvehmod.updated_login_user_id, 
            (select tblstatus.user_name from admin.tbl_admin tblstatus where tblstatus.id = tblvehmod.updated_login_user_id) as updated_login_user_name,
            tblvehmod.updatedon_date,
            tblvehmod.updatedby_user_type_enum_id,
            (select tblstatus.enum_key from tbl_enum tblstatus where tblstatus.enum_id = tblvehmod.updatedby_user_type_enum_id) as updated_by_user_type_name,            
            (select tblstatus.amount from admin.tbl_minimum_wallet_amount_update_history tblstatus order by tblstatus.id desc limit 1 ) as min_wallet_amount ,
         --(select tblstatus.amount from admin.tbl_minimum_wallet_amount_update_history tblstatus order by tblstatus.id desc limit 1 ) as deposit_amount ,
            tblvehmod.max_range_100_battery_in_km                         
            FROM masters.tbl_vehicle_model tblvehmod 
            WHERE (tblvehmod.id = $1 OR $1 = 0) AND (tblvehmod.status_enum_id = $2 OR $2 = 0)
            `;
        },
        addUpdateVehicleModelDetails: () => {
            return `select * from masters.fn_add_update_vehicle_model($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)`;
        },

        insertVehicleModelQuery:() => 
        {
        return `insert into  masters.tbl_vehicle_model
        (
	     model_name,
	     brand_name ,       	
	
	    vehicle_type ,
	    break_type ,
	    battery_type_enum_ids,
	 
        frame_type_enum_ids ,
        battery_capacity_ah ,
        battery_capacity_volt,

        accesarries_enum_ids,
	
        color ,
	    motor_type ,     
        status_enum_id ,
	
    	remarks,
	    createdby_login_user_id ,
    	createdon_date	,
        brackes_type ,
        max_range_100_battery_in_km

        ) values 
        (
            $1,$2,$3,$4,$5, $6, $7, $8,$9,$10,$11,$12,$13,$14,$15,'check',$16
        )
            RETURNING id;`
        },

        updateVehicleModelQuery:() => 
        {
        return `update  masters.tbl_vehicle_model set 
        
	     model_name =$2,
	     brand_name =$3,
       	 
	
	    vehicle_type =$4,
	    break_type =$5,
	    battery_type_enum_ids =$6,
	 
        frame_type_enum_ids =$7,
        battery_capacity_ah=$8 ,
        battery_capacity_volt=$9,

        accesarries_enum_ids=$10,
	
        color =$11,
	    motor_type =$12,

        status_enum_id =$13,
	
    	remarks =$14,
	    updated_login_user_id =$15,
    	updatedon_date =$16 ,
        max_range_100_battery_in_km =$17
        where id = $1`
        },

        getVehicleModel:() =>
        {
            return `select  vm.id , vm.model_name,
            vm.brand_name ,
            vm.company_name,       
            vm.vehicle_type ,	
           (select tblstatus.name from masters.tbl_vehicle_type tblstatus where tblstatus.id = vm.vehicle_type) as vehicle_type_name,
           (SELECT json_agg(json_build_object('id',breaktype.enum_id,'Name',breaktype.enum_key)) FROM public.tbl_enum breaktype WHERE breaktype.enum_id=any((vm.break_type) )) as break_type_name_json,
           vm.break_type ,	           
           vm.battery_type_enum_ids,
		   (SELECT json_agg(json_build_object('id',batteryType.enum_id,'Name',batteryType.enum_key)) FROM public.tbl_enum batteryType WHERE batteryType.enum_id=any((vm.battery_type_enum_ids) )) as battery_type_name_json,
               	 
           vm.frame_type_enum_ids ,
           (select (tblstatus.enum_key) from tbl_enum tblstatus where tblstatus.enum_id = vm.frame_type_enum_ids) as fram_type_name, 
           vm.battery_capacity_ah ,
           vm.battery_capacity_volt,
           vm.accesarries_enum_ids,	
		   (SELECT json_agg(json_build_object('id',accesarriesType.enum_id,'Name',accesarriesType.enum_key)) FROM public.tbl_enum accesarriesType WHERE accesarriesType.enum_id=any((vm.accesarries_enum_ids) )) asaccesarries_name_json,            
           vm.color ,
           vm.motor_type ,     
           vm.status_enum_id ,   
           (select tblstatus.enum_key from tbl_enum tblstatus where tblstatus.enum_id = vm.status_enum_id) as status_name,    
           vm.remarks,
           vm.createdby_login_user_id ,
           (select tblstatus.user_name from admin.tbl_admin tblstatus where tblstatus.id = vm.createdby_login_user_id) as created_by_user_name,
           vm.createdon_date	,
           vm.updatedon_date ,
           vm.brackes_type  ,
           max_range_100_battery_in_km
           from masters.tbl_vehicle_model  vm
           where (id = $1 Or $1 =0) and (vm.status_enum_id =$2 OR $2 =0) order by id desc `;
        },

        checkExistVehicleModelQuery:() => 
        {
        return `SELECT id FROM  masters.tbl_vehicle_model WHERE model_name =$1 and  id <> $2 limit 1`
        },

        getVehicleList: () => {
            return `select  tblvehmod.id   ,
            tblvehmod.model_name ,
            tblvehmod.vehicle_type ,
            (select tblstatus.name from masters.tbl_vehicle_type tblstatus where tblstatus.id = tblvehmod.vehicle_type) as vehicle_type_name
            FROM masters.tbl_vehicle_model tblvehmod
           WHERE tblvehmod.status_enum_id = 1`;
        },   
        addVehicleImage: () => {
            return `INSERT INTO masters.tbl_vehicle_model_image(
                 vehicle_id, image_name, image_unique_name, status_enum_id, createdon_date, createdby_login_user_id,image_serial_number,image_for)
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8);`;
        },

        deactiveVehicleImage: () => {
            return `update masters.tbl_vehicle_model_image set  status_enum_id = 2 where vehicle_id = $1 `;
        },

        updateVehicleImage: () => {
            return `update masters.tbl_vehicle_model_image set 

                    vehicle_id =$2, 
                    image_name =$3, 
                    image_unique_name =$4,

                    status_enum_id =$5,
                    updatedon_date =$6,
                    updated_login_user_id=$7,
                    
                    image_serial_number=$8,
                    image_for =$9

                   where id = $1`;
        },
        getImageBase64Q: () => {
            return `SELECT id, image_name, image_unique_name, status_enum_id, 
            image_for
            FROM masters.tbl_vehicle_model_image where id=$1 and status_enum_id=1 order by image_serial_number asc;`;
        },

        getImageByVehicleId: () => {
            return `SELECT id, vehicle_id, image_name, image_unique_name, status_enum_id, remarks, action_remarks, createdon_date, createdby_login_user_id, createdby_user_type_enum_id, updated_login_user_id, updatedon_date, updatedby_user_type_enum_id,image_serial_number, 
            image_for
            FROM masters.tbl_vehicle_model_image where vehicle_id=$1 and status_enum_id=1 order by image_serial_number asc;`;
        },
        deleteUnUsedImageOFVehicleByVehicleId: () => {
            return `DELETE FROM masters.tbl_vehicle_model_image where vehicle_id=$1`;
        }
    },

    inwardQueries: {
        bikeInward: {
            
            updateBikeAllocatedToProduction: () => {
                return `UPDATE inventory.tbl_uid 
                SET bike_status_enum_id =5  where  id=$1`;
            },
            insertUIdNumber: () => {
                return `INSERT INTO inventory.tbl_uid(
                 model_id, model_uid, status_enum_id, remarks, createdby_login_user_id, createdby_user_type_enum_id, createdon_date,inward_date)
                VALUES ( $1, $2, $3, $4, $5, $6, $7,$8) RETURNING id;`;
            },

            updateUIdNumberByInward: () => {
                return `update  inventory.tbl_uid set 
                model_uid = $1, 
                status_enum_id = $2 , 
                action_remarks = $3,
                updatedon_date = $4,
                updated_login_user_id = $5 ,
                model_id =$6 ,
                inward_date = $7 
                where  id = $8 ;
            `;
            },
            updateUIdStatusFromBikeProduce: () => {
                return `UPDATE inventory.tbl_uid
                SET  bike_produce_allotment_id=5
                  WHERE id = $1;`;
            },
            updateUIdStatusFromZoneAllotment: () => {
                return `UPDATE inventory.tbl_uid
                SET bike_zone_allotment_allotment_id=5
                  WHERE   id = $1;`;
            },           
          
            checkUIdNumber: () => {
                return `SELECT  id  FROM inventory.tbl_uid WHERE  UPPER(TRIM(model_uid))=UPPER(TRIM($1)) AND COALESCE($1,'')!='' AND  id <> $2`;
            },
            getBikeInwardDetails: () => {
                return `SELECT tblbike.id, 
                tblbike.inward_date,
                  tblbike.model_id,
                  (SELECT tblveh.model_name from  masters.tbl_vehicle_model  tblveh  WHERE  tblveh.id =  tblbike.model_id ) as model_name,
                  tblbike.model_uid as uid, 
                  tblbike.status_enum_id, 
                  (select tblstatus.enum_key from tbl_enum tblstatus where tblstatus.enum_id = tblbike.status_enum_id) as status_name,
                  tblbike.remarks, 
                  tblbike.action_remarks, 
                  tblbike.createdon_date, 
                  tblbike.createdby_login_user_id, 
                  (select tblstatus.user_name from admin.tbl_admin tblstatus where tblstatus.id = tblbike.createdby_login_user_id) as created_by_user_name,
                  tblbike.createdby_user_type_enum_id, 
                  (select tblstatus.enum_key from tbl_enum tblstatus where tblstatus.enum_id = tblbike.createdby_user_type_enum_id) as created_by_user_type_name,
                  tblbike.updated_login_user_id, 
                  (select tblstatus.user_name from admin.tbl_admin tblstatus where tblstatus.id = tblbike.updated_login_user_id) as updated_login_user_name,
                  tblbike.updatedon_date,
                  tblbike.updatedby_user_type_enum_id,
                  (select tblstatus.enum_key from tbl_enum tblstatus where tblstatus.enum_id = tblbike.updatedby_user_type_enum_id) as updated_by_user_type_name,
                  tblbike.bike_status_enum_id, 
                  (select tblstatus.enum_key from tbl_enum tblstatus where tblstatus.enum_id = tblbike.bike_status_enum_id) as bike_status_name
                  FROM inventory.tbl_uid tblbike
                  WHERE  (tblbike.id = $1 or $1 = 0) and 
                  (tblbike.status_enum_id =  $2  or $2 =0) and 
                  (tblbike.bike_status_enum_id=$3 or $3 =0)
                  order by tblbike.id desc;`;
            },
            getUidListByVehicleId: () => {
                return `select  id , model_uid from  inventory.tbl_uid where model_id =$1 and status_enum_id = 1 
                and( bike_produce_allotment_id=$2 or $2 =0) and (bike_zone_allotment_allotment_id= $3 or $3=0) `;
            },

            getUidListWithBiekAndLock: () => {
                return `select  ud.id ,
				     ud.model_uid ,
				    tblProdBike.bike_name,
			        tblProdBike.id as bike_id ,
			        tbllock.lock_number,
			        tbllock.id as lock_id
		            from  inventory.tbl_uid  ud
				left join inventory.tbl_product_bike tblProdBike on
			tblProdBike.uid_id = ud.id and tblProdBike.status_enum_id = 1
			left join   inventory.tbl_lock_detail tbllock on 
             tblProdBike.lock_id = tbllock.id  and tbllock.status_enum_id =1
             where ud.model_id =$1 and ud.status_enum_id = 1 
                and( ud.bike_produce_allotment_id=$2 or $2 =0) and (ud.bike_zone_allotment_allotment_id= $3 or $3=0)
             `;
            },
         
            activeInactiveUidNumber: () => {
                return `UPDATE inventory.tbl_uid SET  status_enum_id = $1, updatedon_date = $2 WHERE  id =  $3;`;
            },

            activeDeactiveBike:()=>
            {
                return `UPDATE inventory.tbl_product_bike SET  status_enum_id = $1 WHERE  id =  $2`;
            },


            updateBikeLockAllotmentStatus: () => {
                return `UPDATE  inventory.tbl_lock_detail SET allotment_status_id=$2 WHERE id=$1`;
            },

           

            updateBikeAllocatedToInward: () => {
                return `UPDATE inventory.tbl_uid 
                SET bike_status_enum_id =$2 ,
                status_enum_id = $3 where id=$1;`;
            },

           updateBikeUIdStatusFromBikeProduce: () => {
                return `UPDATE inventory.tbl_uid
                SET  bike_produce_allotment_id=$2
                  WHERE id = $1;`;
            },

        },
        lockInward: {
            checkLockNumber: () => {
                return `select id ,registartion_status from inventory.tbl_lock_detail WHERE  lock_number=$1`;
            },           
                  
            IMEIAndLockNumberExit: () => {
                return `select id from inventory.tbl_lock_detail WHERE  imei_number=$1   AND  lock_number=$2`;
            },

            //lock_number_id=$1, lock_number_imei_id=$2,         
            insertLockDetails: () => {
                return `INSERT INTO inventory.tbl_lock_detail(
                    lock_number, status_enum_id, remarks, createdby_login_user_id,
                     createdby_user_type_enum_id,createdon_date,instruction_id,device_light_status_enum_id, device_light_instruction_enum_id,device_lock_and_unlock_status,beep_instruction_enum_id,
                     beep_status_enum_id,last_distance_in_meters,total_distance_in_meters,inward_date,imei_number,registartion_status)
                    VALUES ($1, $2, $3, $4, $5, $6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,false) RETURNING id;`;
            },           
            updateLockDetails: () => {
                return `update inventory.tbl_lock_detail set
                        lock_number = $1 , 
                        status_enum_id = $2 , 
                        remarks = $3 , 
                        instruction_id =$4 ,
                        updatedon_date= $5,
                        updated_login_user_id= $6,
                        inward_date = $8 ,
                        imei_number = $9 
                        where id = $7`;
             },
                       
            getLockInward: () => {
                return `SELECT tbllock.id, 
                
                tbllock.lock_number   as lock_number,
                
                 tbllock.imei_number  as lock_number_imei,
                tbllock.inward_date, 
                tbllock.status_enum_id, 
                (select tblstatus.enum_key from tbl_enum tblstatus where tblstatus.enum_id = tbllock.status_enum_id) as status_name,
                tbllock.remarks, 
                tbllock.action_remarks, 
                tbllock.createdon_date, 
                tbllock.createdby_login_user_id, 
                (select tblstatus.user_name from admin.tbl_admin tblstatus where tblstatus.id = tbllock.createdby_login_user_id) as created_by_user_name,
                tbllock.createdby_user_type_enum_id, 
                (select tblstatus.enum_key from tbl_enum tblstatus where tblstatus.enum_id = tbllock.createdby_user_type_enum_id) as created_by_user_type_name,
                tbllock.updated_login_user_id, 
                (select tblstatus.user_name from admin.tbl_admin tblstatus where tblstatus.id = tbllock.updated_login_user_id) as updated_login_user_name,
                tbllock.updatedon_date,
                tbllock.updatedby_user_type_enum_id,
                (select tblstatus.enum_key from tbl_enum tblstatus where tblstatus.enum_id = tbllock.updatedby_user_type_enum_id) as updated_by_user_type_name,

                tbllock.instruction_id  as instruction_id,
                tbllock.registartion_status   as registration_status,
                tbllock.allotment_status_id   as allotment_status_id
                FROM inventory.tbl_lock_detail tbllock 
                WHERE  (tbllock.id = $1 or $1 = 0) and 
                (tbllock.status_enum_id =  $2  or $2 =0)
                order by tbllock.id desc 
                ;`;
            },

            updateLockAllotmentStatus: () => {
                return `UPDATE  inventory.tbl_lock_detail SET allotment_status_id=5 WHERE id=$1`;
            },
            getLockList: () => {
                return `select  id ,lock_number from  inventory.tbl_lock_detail where status_enum_id=1 and registartion_status=true and allotment_status_id=6 `;
            },            
            activeInactiveLockNumber: () => {
                return `update  inventory.tbl_lock_detail set  status_enum_id = $1 , updatedon_date= $2 where id = $3`;
            },           
            LockDetailsFromDevice: () => {
                return `insert into inventory.tbl_lock_detail_from_device(lock_details)
                values($1)`;
            },           
            deleteLockDetails: () => {
                return `DELETE FROM inventory.tbl_lock_detail WHERE id = $1`;
            },
                        
        getLockDetails: () => {
                return `SELECT id, lock_number, status_enum_id, remarks, action_remarks, createdon_date, createdby_login_user_id, createdby_user_type_enum_id, updated_login_user_id, updatedon_date, updatedby_user_type_enum_id, name, device_id, registration_number, location, latitude, longitude, altitude, speed, battery, internal_batt_v, external_batt_v,
                device_lock_and_unlock_status,
                (select dls.name from  masters.tbl_device_lock_status dls where  dls.id =device_lock_and_unlock_status ) as device_lock_and_unlock_status_name,
                 instruction_id, registartion_status, imei_number, serial_number, odometer, run_time, chassis_number, date_of_manufacture, date_of_service
               device_last_request_time,deveice_state_enum_id,
               (select tblstatus.enum_key from tbl_enum tblstatus where tblstatus.enum_id = deveice_state_enum_id) as deveice_state,
               
               device_light_instruction_enum_id ,
          (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id = device_light_instruction_enum_id)as device_light_instruction,
         device_light_status_enum_id ,
          (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id = device_light_status_enum_id)as device_light_status ,
          lastdevicerequesttime,
          power_on_off_status_enum_id ,
          (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id = power_on_off_status_enum_id)as power_on_off_status            
               FROM inventory.tbl_lock_detail where  id =$1;`;
            },
            checkLockNameExit: () => {
                return `select id from inventory.tbl_lock_detail WHERE UPPER(TRIM(name))= UPPER(TRIM($1))`;
            },
            checkuniqueidExit: () => {
                return `select id from inventory.tbl_lock_detail WHERE (TRIM(me_unique_id))= (TRIM($1)) `;
            },
            checkdeviceidExit: () => {
                return `select id,lock_number ,device_last_request_time from inventory.tbl_lock_detail WHERE (TRIM(device_id))= (TRIM($1)) `;
            },
            insertDeviceDetailForUserAPIQuery: () => { 
                return `insert into inventory.tbl_lock_detail(
                    name , 
                    device_id,
                  me_unique_id,
                  me_moving ,
                  me_ignition,
                  me_state_enum_id ,
                  me_device_vehicle_type_enum_id ,                 
                  me_disabled ,
                  me_created_at_date,
                  me_accountid,
                  me_statesince_date,
                  me_protocol,
                  me_server_datetime,
                  me_device_datetime,
                  me_fix_datetime,
                  me_isvalid_device_packet   ,
                  me_course,
                  me_address,
                  me_accuracy,
                  me_network,
                  location ,
                  latitude ,
                  longitude ,
                  altitude,
                  speed,
                  battery,
                  internal_batt_v,
                  external_batt_v,
                  device_lock_and_unlock_status ,
                  instruction_id ,
                  registartion_status ,
                  imei_number,    
                  allotment_status_id,
                  deveice_state_enum_id ,
                  device_last_request_time,
                  lock_number,
                  status_enum_id ,
                  createdon_date,
                  remarks,
                  em_devece_type,
                  me_state_name,
                  inward_date ,
                  power_on_off_status_enum_id  ,
                  lastdevicerequesttime               
                  )
                  values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31,$32,$33,$34,$35,$36,$37,$38,$39,$40,$41,$42,$43,$44)
                   RETURNING id;`;
                },

                checkDeviceStateExit: () => {
                    return `select id from masters.tbl_device_state WHERE  UPPER(TRIM(name))= UPPER(TRIM($1))`;
                },
            insertDeviceState:()=>
            {
                return `insert into masters.tbl_device_state(name, status_enum_id ,createdon_date)
                      values($1,$2,$3)   RETURNING id;` 
            },

            checkLockNumberExit: () => {
                return `select id from inventory.tbl_lock_detail WHERE  lock_number=$1   AND  id <> $2`;
            },
        
            checimeiNumberExit: () => {
                return `select id from inventory.tbl_lock_detail WHERE  imei_number=$1   AND  id <> $2`;
            },


            checkLockIdExit: () => {
                return `select lock_number,registartion_status from inventory.tbl_lock_detail WHERE   id = $1`;
            },
                    

            checkLockIdExitForDelete: () => {
                return `select id,registartion_status from inventory.tbl_lock_detail WHERE   lock_number = $1`;
            },
                 
            insertPostBodyDataQuery: () => {
                return `INSERT INTO masters.tbl_postbody(
                        data,createdon_date)
                    VALUES ($1, $2) RETURNING id; `;
            },

            
            insertGetBodyDataQuery: () => {
                return `INSERT INTO masters.tbl_getbody(
                    data,createdon_date)
                    VALUES ($1, $2) RETURNING id; `;
            },

            // insertApiRequestDataQuery: () => {
            //     return `INSERT INTO  admin.tbl_add_api_request_and_responce(
            //         request_data,Request_from,createdon_date)
            //         VALUES ($1,$2,$3) RETURNING id; `;
            // },

            insertApiResponceDataQuery: () => {
                return `INSERT INTO  admin.tbl_add_api_request_and_responce(
                    responce_data,Request_from)
                    VALUES ($1,$2,$3) RETURNING id; `;
            },


            insertApiExceptionDataQuery: () => {
                return `INSERT INTO  admin.tbl_api_exception(
                    tbl_api_request_id,  
                    exception_full ,
                    exception_name ,

                    exception_message ,
                    dbquery  ,
                    dbquery_parameters,
                    exception_stack ,

                    resolved_status_enum_id ,
                    resolved_remarks ,
                    createdon_date ,

                    createdby_login_user_id,
                    custom_error)
                    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id; `;
            },


            insertApiRequestDataQuery: () => {
                return `INSERT INTO   admin.tbl_api_request(
                    frontend_option_name ,
                    frontend_page_name ,
                    frontend_action_name, 
                    api_method_enum_id ,
                    api_url , 
                    api_request_from_enum_id ,
                    access_token ,
                    request_data ,                   
                    createdon_date,
                    createdby_login_user_id,
                    request_ipaddress,
                    lock_number)
                    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id; `;
            },
            updateApiResponceDataQuery: () => {
                return `update  admin.tbl_api_request_and_response set 
                    response_data =$2 ,
                    response_status_enum_id =$3,
                    exception_full =$4,
                    exception_name =$5,
                    exception_message =$6
                    where id = $1 `;
            },
          
        }
    },

    bikeProduce: {
        insertBikeProduce: () => {
            return `INSERT INTO inventory.tbl_product_bike(
                 model_id, uid_id, lock_id, status_enum_id, generated_qr,remarks, createdby_login_user_id, createdby_user_type_enum_id,createdon_date,encrypt_qr_data,zone_id,bike_name,geofence_inout_enum_id ,qr_number)
                 VALUES ($1, $2, $3, $4, $5, $6, $7,$8,$9,$10,$11,$12,$13,$14) RETURNING id;`;
        },
        updateBikeProduce: () => {
            return `UPDATE inventory.tbl_product_bike
            SET  model_id=$1, uid_id=$2, lock_id=$3, status_enum_id=$4,generated_qr=$5,action_remarks=$6, updated_login_user_id=$7, updatedby_user_type_enum_id=$8, updatedon_date=$9 ,encrypt_qr_data=$10,
                  zone_id = $12
            WHERE id=$11`;
        },

        updateQRcodeForBikeProduce:() =>{
            return  `UPDATE inventory.tbl_product_bike
                      SET qr_number = $2 ,
                      encrypt_qr_data=$3 ,
                      generated_qr=$4,
                      action_remarks=$5, 
                      updated_login_user_id =$6, 
                      updatedon_date=$7
                       WHERE id=$1`;
        },

        updateZoneAllotmentStatusForProduceBike: () => {
            return ` UPDATE inventory.tbl_product_bike  set allotment_status = 5 , zone_id = $3 where model_id=$1 and uid_id=$2`;
        },

        getBikeReservedUnReservedStatus: () => {
            return `select  tblProdBike.id,
            tblProdBike.bike_booked_status, 
            (select enum_key  from public.tbl_enum  where enum_id = tblProdBike.bike_booked_status) ,
            tblProdBike.model_id , 
            (select tblvehmod.model_name  FROM masters.tbl_vehicle_model tblvehmod where tblvehmod.id= tblProdBike.model_id  limit 1)as model_name,
            tblProdBike.lock_id , 
            tblProdBike.uid_id ,
            tblProdBike.zone_id 
              from  inventory.tbl_product_bike tblProdBike  where tblProdBike.model_id=$1 and  tblProdBike.uid_id=$2 and  tblProdBike.lock_id=$3 limit 1 `;
        },
        getBikeProduceDetails: () => {
            return `SELECT tblProdBike.id,
            tblProdBike.model_id, 
            (SELECT tblveh.model_name from  masters.tbl_vehicle_model  tblveh  WHERE  tblveh.id =  tblProdBike.model_id ) as model_name,
            tblProdBike.uid_id,
            (SELECT tblveh.model_uid from  inventory.tbl_uid  tblveh  WHERE  tblveh.id =  tblProdBike.uid_id ) as uid_number,
            tblProdBike.lock_id,
            (SELECT tblveh.lock_number from  inventory.tbl_lock_detail  tblveh  WHERE  tblveh.id =  tblProdBike.lock_id ) as lock_number,
            tbllock.latitude,tbllock.longitude,tbllock.altitude,
            tbllock.device_lock_and_unlock_status,
            tbllock.imei_number as lock_imei_number ,            
            tblProdBike.status_enum_id, 
            (select tblstatus.enum_key from tbl_enum tblstatus where tblstatus.enum_id = tblProdBike.status_enum_id) as status_name,
            tblProdBike.remarks, 
            tblProdBike.action_remarks, 
            tblProdBike.createdon_date, 
            tblProdBike.createdby_login_user_id, 
            (select tblstatus.user_name from admin.tbl_admin tblstatus where tblstatus.id = tblProdBike.createdby_login_user_id) as created_by_user_name,
            tblProdBike.createdby_user_type_enum_id, 
            (select tblstatus.enum_key from tbl_enum tblstatus where tblstatus.enum_id = tblProdBike.createdby_user_type_enum_id) as created_by_user_type_name,
            tblProdBike.updated_login_user_id, 
            (select tblstatus.user_name from admin.tbl_admin tblstatus where tblstatus.id = tblProdBike.updated_login_user_id) as updated_login_user_name,
            tblProdBike.updatedon_date,
            tblProdBike.updatedby_user_type_enum_id,
            (select tblstatus.enum_key from tbl_enum tblstatus where tblstatus.enum_id = tblProdBike.updatedby_user_type_enum_id) as updated_by_user_type_name,
            tblProdBike.generated_qr,
            tblProdBike.allotment_status,
            tblProdBike.bike_booked_status,
            tbllock.deveice_state_enum_id,
            (select tblstatus.enum_key from tbl_enum tblstatus where tblstatus.enum_id = tbllock.deveice_state_enum_id) as deveice_state,
            tbllock.device_last_request_time,
            tbllock.instruction_id,
            (select zd.name from masters.tbl_zone_detail zd where zd.id = tblProdBike.zone_id) as zone_name ,
            (select tblstatus.enum_key from tbl_enum tblstatus where tblstatus.enum_id = tblProdBike.bike_booked_status) as bike_booked_status_name,
            (select tblstatus.enum_key from tbl_enum tblstatus where tblstatus.enum_id = tblProdBike.allotment_status) as allotment_status_name ,
            ar.name as area_name ,
			ar.id as area_id ,
			city.map_city_id ,
			city.map_city_name,
			st.map_state_id , 
			st.map_state_name ,
            tblProdBike.qr_number
            FROM inventory.tbl_product_bike tblProdBike 
            inner join   inventory.tbl_lock_detail tbllock on 
            tblProdBike.lock_id = tbllock.id 
            
left join masters.tbl_zone_detail zd on 
zd.id = tblProdBike.zone_id 
left join masters.tbl_area ar on
zd.area_id = ar.id 
left join masters.tbl_map_city city on 
city.map_city_id = ar.map_city_id 
left join masters.tbl_map_state st on 
city.map_state_id = st.map_state_id
               WHERE  (tblProdBike.id = $1 or $1 = 0) AND  
            (tblProdBike.status_enum_id = $2  or $2 = 0)
            order by tblProdBike.id desc;`;
        },
        getEncryptedData: () => {
            return `select id,model_id ,uid_id , lock_id FROM inventory.tbl_product_bike tblProdBike 
            where encrypt_qr_data=$1 and tblProdBike.status_enum_id=1 `;
        },

        getBikeId:() =>
        {
            return `select tblProdBike.id ,tblProdBike.encrypt_qr_data ,tblProdBike.model_id ,
            tblProdBike.uid_id,
            tblProdBike.lock_id
			  FROM  inventory.tbl_lock_detail  ld             
               inner join  inventory.tbl_product_bike tblProdBike on   
		      ld.id = tblProdBike.lock_id
            where  (ld.lock_number =$1 OR tblProdBike.qr_number = $1) `
        },
        checkSameCombinationBikeNotProduce: () => {
            return `select id from  inventory.tbl_product_bike tblProdBike where    tblProdBike.uid_id=$1 and   tblProdBike.lock_id = $2  and tblProdBike.id<>$3`;
        },

        checkNameBike: () => {
            return `select  from  inventory.tbl_product_bike tblProdBike where    tblProdBike.uid_id=$1 and tblProdBike.lock_id = $2`;
        },

        checkLockNumberWithBike: () => {
            return `select id from  inventory.tbl_product_bike tblProdBike where      tblProdBike.lock_id = $2  and tblProdBike.id<>$2 and  and tblProdBike.status_enum_id ='1'`;
        },
        checkUIdNumberWithBike: () => {
            return `select id from  inventory.tbl_product_bike tblProdBike where    tblProdBike.uid_id=$1 and tblProdBike.id<>$2 and tblProdBike.status_enum_id ='1'`;
        },
       // UPPER(TRIM(name))= UPPER(TRIM($2)) and city_id = $3 and id <> $1 limit 1
        checkNameBikeExitOrNot: () => {
            return `select id  from  inventory.tbl_product_bike tblProdBike where  UPPER(TRIM(tblProdBike.bike_name)) =UPPER(TRIM($1)) and tblProdBike.id <> $2 limit 1`;
        },

        activeRideList: () => {
            return `SELECT  distinct on(tblProdBike.id)
            tblProdBike.id  as bike_id,
            tblProdBike.bike_name,
           auser.id as user_id,
           rbook.id as booking_id,
           rbook.light_off_count ,
           rbook.light_on_count ,
           rbook.device_lock_count,
           rbook.device_unlock_count,
           auser.user_name ,
           auser.mobile ,
          rbook.from_ride_time ,
          rbook.id as ride_booking_id,
           tbllock.lock_number ,
           tblProdBike.lock_id,
           tbllock.deveice_state_enum_id ,
           tblProdBike.bike_booked_status,
           (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tblProdBike.bike_booked_status) as bike_booked_status_name,
           (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tbllock.deveice_state_enum_id ) as deveice_status,
          tbllock.device_lock_and_unlock_status,

          (select dls.name from masters.tbl_device_lock_status dls where  dls.id =tbllock.device_lock_and_unlock_status ) as device_lock_unlock_status,
          tbllock.instruction_id ,
          (select display_name from masters.tbl_device_instractions where id = tbllock.instruction_id)  instruction_name ,
          tbllock.location ,
          tbllock.latitude ,
          tbllock.longitude ,
          tbllock.altitude ,
          tbllock.battery  ,
          rbook.from_ride_time, 
          rbook.to_ride_time ,
          coalesce(tbllock.device_last_request_time, tbllock.lastdevicerequesttime) as device_last_request_time,
          tbllock.device_light_status_enum_id ,
           (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tbllock.device_light_status_enum_id)as deveice_light_status,
           tbllock.device_light_instruction_enum_id , 
          (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tbllock.device_light_instruction_enum_id)as device_light_instruction ,
          tbllock.beep_status_enum_id ,
          (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tbllock.beep_status_enum_id)as beep_status_name,
          tbllock.beep_instruction_enum_id , 
          (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tbllock.beep_instruction_enum_id)as beep_instruction_name,
          tblProdBike.geofence_inout_enum_id,
          (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tblProdBike.geofence_inout_enum_id)as geofence_inout_name 
          
                  FROM inventory.tbl_product_bike tblProdBike
                      
                  inner join   inventory.tbl_lock_detail tbllock on 
                  tblProdBike.lock_id = tbllock.id
                  inner join  admin.tbl_ride_booking  rbook on
                  rbook.vehicle_lock_id = tbllock.id and bike_rideing_status = 16
                  inner join 	admin.tbl_admin	auser on 
                  auser.id = rbook.user_id
                  where 
                  tblProdBike.bike_booked_Status = 13 and tblProdBike.status_enum_id =1
                  and (tblProdBike.zone_id = $1 OR $1 =0 )`;
        },
        activeRideListWithMapCitySearch: () => {
            return `SELECT  distinct on(tblProdBike.id)
            tblProdBike.id  as bike_id,
            tblProdBike.bike_name,
           auser.id as user_id,
           rbook.id as booking_id,
           rbook.ride_booking_no,
           rbook.light_off_count ,
           rbook.light_on_count ,
           rbook.device_lock_count,
           rbook.device_unlock_count,
           auser.user_name ,
           auser.mobile ,
           rbook.from_ride_time ,
           tbllock.lock_number ,
           tblProdBike.lock_id,
           tblProdBike.bike_booked_status,
           (select tblenum.enum_key from public.tbl_enum tblenum where tblenum.enum_id=tblProdBike.bike_booked_status) as bike_booked_status_name,


           tbllock.deveice_state_enum_id ,
           (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tbllock.deveice_state_enum_id ) as deveice_status,
          tbllock.device_lock_and_unlock_status,

          (select dls.name from masters.tbl_device_lock_status dls where  dls.id =tbllock.device_lock_and_unlock_status ) as device_lock_unlock_status,
          tbllock.instruction_id ,
          (select display_name from masters.tbl_device_instractions where id = tbllock.instruction_id)  instruction_name ,
          tbllock.location ,
          tbllock.latitude ,
          tbllock.longitude ,
          tbllock.altitude ,
          tbllock.battery  ,
          coalesce(tbllock.device_last_request_time, tbllock.lastdevicerequesttime) as device_last_request_time,
          tbllock.device_light_status_enum_id ,
           (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tbllock.device_light_status_enum_id)as deveice_light_status,
           tbllock.device_light_instruction_enum_id , 
          (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tbllock.device_light_instruction_enum_id)as device_light_instruction ,
          tbllock.beep_status_enum_id ,
          (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tbllock.beep_status_enum_id)as beep_status_name,
          tbllock.beep_instruction_enum_id , 
          (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tbllock.beep_instruction_enum_id)as beep_instruction_name,
          
          tblProdBike.geofence_inout_enum_id,
          (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tblProdBike.geofence_inout_enum_id)as geofence_inout_name  ,
          tbllock.power_on_off_status_enum_id ,
           (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tbllock.power_on_off_status_enum_id)as power_on_off_status 
 
                  FROM inventory.tbl_product_bike tblProdBike
                      
                  inner join   inventory.tbl_lock_detail tbllock on 
                  tblProdBike.lock_id = tbllock.id
                  inner join  admin.tbl_ride_booking  rbook on
                  rbook.vehicle_lock_id = tbllock.id and bike_rideing_status = 16
                  inner join 	admin.tbl_admin	auser on 
                  auser.id = rbook.user_id
				  left join masters.tbl_zone_detail zd on
	  tblProdBike.zone_id = zd.id 
	  left join masters.tbl_area ar on 
	  zd.area_id = ar.id
	  left join masters.tbl_map_city cities on   
      cities.map_city_id=ar.map_city_id 
	  left join masters.tbl_map_state states on
      states.map_state_id =cities.map_state_id
	  left join masters.tbl_map_country countrys on
	  countrys.map_country_id =states.map_country_id 
	  where  
	    tblProdBike.bike_booked_Status = 13 and tblProdBike.status_enum_id =1 and    
      ( UPPER(TRIM(countrys.map_country_name)) = UPPER(TRIM($1))  OR $1='' ) and 
	  ( UPPER(TRIM(states.map_state_name)) =  UPPER(TRIM($2)) OR $2 ='' ) and
	  ( UPPER(TRIM(cities.map_city_name)) = UPPER(TRIM($3)) OR $3='' OR   UPPER(TRIM(cities.user_city_name)) = UPPER(TRIM($3))) 
      and  (rbook.id = $4 OR $4 =0) 
       --and  (tblProdBike.zone_id = $4 OR $4 =0) 
      --order by countrys.map_country_name ,states.map_state_name,cities.map_city_name  asc;`;
        },
        
        deviceLatLog: () => {
            return `SELECT 
                        tbllock.id as lock_id,
                        tbllock.lock_number,
                        tbllock.device_id,
                        tbllock.imei_number,
                        tblProdBike.id as bike_id,
                        tblProdBike.bike_name,
                        tbllock.location,
                        tbllock.latitude,
                        tbllock.longitude,
                        tbllock.altitude
                        FROM inventory.tbl_lock_detail tbllock
                        LEFT JOIN inventory.tbl_product_bike tblProdBike
                            ON tblProdBike.lock_id = tbllock.id
                            AND tblProdBike.status_enum_id = 1
                        WHERE upper(trim(coalesce(tbllock.lock_number, ''))) = upper(trim($1))
                             OR upper(trim(coalesce(tbllock.device_id, ''))) = upper(trim($1))
                             OR upper(trim(coalesce(tbllock.imei_number, ''))) = upper(trim($1))
                             OR upper(trim(coalesce(tblProdBike.bike_name, ''))) = upper(trim($1))
                             OR cast(tbllock.id as text) = trim($1)
                             OR cast(tblProdBike.id as text) = trim($1)
                        ORDER BY tblProdBike.id DESC NULLS LAST
                        LIMIT 1`;
        },

        availableBikeList: () => {
            return ` SELECT  tblProdBike.id,
          
            coalesce(tbllock.device_last_request_time, tbllock.lastdevicerequesttime) as device_last_request_time,
            tbllock.lock_number ,
            tblProdBike.lock_id,
            tblProdBike.bike_name,
            tbllock.deveice_state_enum_id ,

            (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tbllock.deveice_state_enum_id ) as deveice_status,
           tbllock.device_lock_and_unlock_status,
           (select dls.name from  masters.tbl_device_lock_status dls where  dls.id =tbllock.device_lock_and_unlock_status ) as device_lock_unlock_status,
           tbllock.instruction_id ,
           (select display_name from masters.tbl_device_instractions where id = tbllock.instruction_id)  instruction_name ,
           tbllock.location ,
           tbllock.latitude ,
           tbllock.longitude ,
           tbllock.altitude ,
           tblProdBike.bike_booked_status,
           (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tblProdBike.bike_booked_status) as bike_booked_status_name,
           (select tbzd.name from masters.tbl_zone_detail tbzd where tbzd.id=tblProdBike.zone_id) as zone_name ,
           tbllock.device_light_status_enum_id ,
           (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tbllock.device_light_status_enum_id)as deveice_light_status,
           tbllock.device_light_instruction_enum_id , 
          (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tbllock.device_light_instruction_enum_id)as device_light_instruction,
          tbllock.battery,
          tbllock.beep_status_enum_id ,
           (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tbllock.beep_status_enum_id)as beep_status_name,
           tbllock.beep_instruction_enum_id , 
           (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tbllock.beep_instruction_enum_id)as beep_instruction_name,
           tblProdBike.geofence_inout_enum_id,
           (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tblProdBike.geofence_inout_enum_id)as geofence_inout_name       
           FROM inventory.tbl_product_bike tblProdBike                       
                   inner join   inventory.tbl_lock_detail tbllock on 
                   tblProdBike.lock_id = tbllock.id                                                    
                   where tblProdBike.bike_booked_Status = 14  and tblProdBike.status_enum_id =1
                       and (tblProdBike.zone_id =$1 OR $1 =0) `;
        },

        availableBikeListWithMapCitySearch: () => {
            return ` SELECT  tblProdBike.id,          
            coalesce(tbllock.device_last_request_time, tbllock.lastdevicerequesttime) as device_last_request_time,
            tbllock.lock_number ,
            tblProdBike.lock_id,
            tblProdBike.bike_name,
            tbllock.deveice_state_enum_id ,
            tblProdBike.bike_booked_status,
            (select tblenum.enum_key from public.tbl_enum tblenum where tblenum.enum_id=tblProdBike.bike_booked_status) as bike_booked_status_name,
            (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tbllock.deveice_state_enum_id ) as deveice_status,
           tbllock.device_lock_and_unlock_status,
           (select dls.name from  masters.tbl_device_lock_status dls where  dls.id =tbllock.device_lock_and_unlock_status ) as device_lock_unlock_status,
           tbllock.instruction_id ,
           (select display_name from masters.tbl_device_instractions where id = tbllock.instruction_id)  instruction_name ,
           tbllock.location ,
           tbllock.latitude ,
           tbllock.longitude ,
           tbllock.altitude ,
           (select tbzd.name from masters.tbl_zone_detail tbzd where tbzd.id=tblProdBike.zone_id) as zone_name ,
           tbllock.device_light_status_enum_id ,
           (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tbllock.device_light_status_enum_id)as deveice_light_status,
           tbllock.device_light_instruction_enum_id , 
          (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tbllock.device_light_instruction_enum_id)as device_light_instruction,
          tbllock.battery,
          tbllock.beep_status_enum_id ,
           (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tbllock.beep_status_enum_id)as beep_status_name,
           tbllock.beep_instruction_enum_id , 
           (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tbllock.beep_instruction_enum_id)as beep_instruction_name ,
           tblProdBike.geofence_inout_enum_id,
           (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tblProdBike.geofence_inout_enum_id)as geofence_inout_name ,
           tbllock.power_on_off_status_enum_id ,
           (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tbllock.power_on_off_status_enum_id)as power_on_off_status 
 


                   FROM inventory.tbl_product_bike tblProdBike
                       
                   inner join   inventory.tbl_lock_detail tbllock on 
                   tblProdBike.lock_id = tbllock.id   
                   left join masters.tbl_zone_detail zd on
                   tblProdBike.zone_id = zd.id 
                   left join masters.tbl_area ar on 
                   zd.area_id = ar.id
                   left join masters.tbl_map_city cities on   
                   cities.map_city_id=ar.map_city_id 
                   left join masters.tbl_map_state states on
                   states.map_state_id =cities.map_state_id
                   left join masters.tbl_map_country countrys on
                   countrys.map_country_id =states.map_country_id                
                                
                   where tblProdBike.bike_booked_Status = 14 and tblProdBike.status_enum_id =1 and    
                   ( UPPER(TRIM(countrys.map_country_name)) = UPPER(TRIM($1)) OR $1='' ) and 
                   ( UPPER(TRIM(states.map_state_name)) =  UPPER(TRIM($2)) OR $2 ='' ) and
                   ( UPPER(TRIM(cities.map_city_name)) = UPPER(TRIM($3)) OR $3='' OR   UPPER(TRIM(cities.user_city_name)) = UPPER(TRIM($3))) 
                  and  (tbllock.id = $4 OR $4 =0) order by countrys.map_country_name,states.map_state_name,cities.map_city_name  `;
        },

        availableLockUnlockCardDetail: () => {
            return ` SELECT  tblProdBike.id,          
            coalesce(tbllock.device_last_request_time, tbllock.lastdevicerequesttime) as device_last_request_time,
            tbllock.lock_number ,
            tblProdBike.lock_id,
            tblProdBike.bike_name,
            tbllock.deveice_state_enum_id ,
            tblProdBike.bike_booked_status,
            (select tblenum.enum_key from public.tbl_enum tblenum where tblenum.enum_id=tblProdBike.bike_booked_status) as bike_booked_status_name,
            (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tbllock.deveice_state_enum_id ) as deveice_status,
           tbllock.device_lock_and_unlock_status,
           (select dls.name from  masters.tbl_device_lock_status dls where  dls.id =tbllock.device_lock_and_unlock_status ) as device_lock_unlock_status,
           tbllock.instruction_id ,
           (select display_name from masters.tbl_device_instractions where id = tbllock.instruction_id)  instruction_name ,
           tbllock.location ,
           tbllock.latitude ,
           tbllock.longitude ,
           tbllock.altitude ,
           (select tbzd.name from masters.tbl_zone_detail tbzd where tbzd.id=tblProdBike.zone_id) as zone_name ,
           tbllock.device_light_status_enum_id ,
           (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tbllock.device_light_status_enum_id)as deveice_light_status,
           tbllock.device_light_instruction_enum_id , 
          (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tbllock.device_light_instruction_enum_id)as device_light_instruction,
          tbllock.battery,
          tbllock.beep_status_enum_id ,
           (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tbllock.beep_status_enum_id)as beep_status_name,
           tbllock.beep_instruction_enum_id , 
           (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tbllock.beep_instruction_enum_id)as beep_instruction_name ,
           tblProdBike.geofence_inout_enum_id,
           (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tblProdBike.geofence_inout_enum_id)as geofence_inout_name ,
           tbllock.power_on_off_status_enum_id ,
           (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tbllock.power_on_off_status_enum_id)as power_on_off_status 
 


                   FROM inventory.tbl_product_bike tblProdBike
                       
                   inner join   inventory.tbl_lock_detail tbllock on 
                   tblProdBike.lock_id = tbllock.id   
                   left join masters.tbl_zone_detail zd on
                   tblProdBike.zone_id = zd.id 
                   left join masters.tbl_area ar on 
                   zd.area_id = ar.id
                   left join masters.tbl_map_city cities on   
                   cities.map_city_id=ar.map_city_id 
                   left join masters.tbl_map_state states on
                   states.map_state_id =cities.map_state_id
                   left join masters.tbl_map_country countrys on
                   countrys.map_country_id =states.map_country_id                
                                
                   where tblProdBike.bike_booked_Status = 14 and tblProdBike.status_enum_id =1 
                   and ( tbllock.power_on_off_status_enum_id = '96' OR tbllock.device_lock_and_unlock_status = '1' )
                   and    
                   ( UPPER(TRIM(countrys.map_country_name)) = UPPER(TRIM($1)) OR $1='' ) and 
                   ( UPPER(TRIM(states.map_state_name)) =  UPPER(TRIM($2)) OR $2 ='' ) and
                   ( UPPER(TRIM(cities.map_city_name)) = UPPER(TRIM($3)) OR $3='' OR   UPPER(TRIM(cities.user_city_name)) = UPPER(TRIM($3))) 
                  and  (tbllock.id = $4 OR $4 =0) order by countrys.map_country_name,states.map_state_name,cities.map_city_name  
                  
                  `;
        },


        getUndermaintenanceBikeWithMapCitySearch: () => {
            return ` SELECT  tblProdBike.id,
            tblProdBike.bike_name,
            coalesce(tbllock.device_last_request_time, tbllock.lastdevicerequesttime) as device_last_request_time,
            tbllock.lock_number ,
            tblProdBike.lock_id,
            tblProdBike.bike_booked_status,
            (select tblenum.enum_key from public.tbl_enum tblenum where tblenum.enum_id=tblProdBike.bike_booked_status) as bike_booked_status_name ,
            tbllock.deveice_state_enum_id ,
            (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tbllock.deveice_state_enum_id ) as deveice_status,
           tbllock.device_lock_and_unlock_status,
           (select dls.name from  masters.tbl_device_lock_status dls where  dls.id =tbllock.device_lock_and_unlock_status ) as device_lock_unlock_status,
           tbllock.instruction_id ,
           (select display_name from masters.tbl_device_instractions where id = tbllock.instruction_id)  instruction_name ,

           tbllock.location ,
           tbllock.latitude ,
           tbllock.longitude ,
           tbllock.altitude ,
           (select tbzd.name from masters.tbl_zone_detail tbzd where tbzd.id=tblProdBike.zone_id) as zone_name ,
           tbllock.device_light_status_enum_id ,
           (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tbllock.device_light_status_enum_id)as deveice_light_status,
           tbllock.device_light_instruction_enum_id , 
          (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tbllock.device_light_instruction_enum_id)as device_light_instruction,
          tbllock.battery,
          tbllock.beep_status_enum_id ,
          (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tbllock.beep_status_enum_id)as beep_status_name,
          tbllock.beep_instruction_enum_id , 
          (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tbllock.beep_instruction_enum_id)as beep_instruction_name,
          tblProdBike.geofence_inout_enum_id,
          (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tblProdBike.geofence_inout_enum_id)as geofence_inout_name   ,
          tbllock.power_on_off_status_enum_id ,
          (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tbllock.power_on_off_status_enum_id)as power_on_off_status 
      
          FROM inventory.tbl_product_bike tblProdBike
                       
                   inner join   inventory.tbl_lock_detail tbllock on 
                   tblProdBike.lock_id = tbllock.id                  
                   inner join masters.tbl_zone_detail zd on
                   tblProdBike.zone_id = zd.id 
                   inner join masters.tbl_area ar on 
                   zd.area_id = ar.id
                   inner join masters.tbl_map_city cities on   
                   cities.map_city_id=ar.map_city_id 
                   inner join masters.tbl_map_state states on
                   states.map_state_id =cities.map_state_id
                   inner join masters.tbl_map_country countrys on
                   countrys.map_country_id =states.map_country_id              
                   where tblProdBike.bike_booked_Status = 35 and tblProdBike.status_enum_id =1  and   
                   ( UPPER(TRIM(countrys.map_country_name)) = UPPER(TRIM($1)) OR $1='') and 
                   ( UPPER(TRIM(states.map_state_name)) =  UPPER(TRIM($2)) OR $2 ='' ) 
                  and (   UPPER(TRIM(cities.map_city_name)) = UPPER(TRIM($3)) OR $3='' OR   UPPER(TRIM(cities.user_city_name)) = UPPER(TRIM($3))) 
                  and  (tbllock.id = $4 OR $4 =0) `;
        } ,

        getUndermaintenanceBike: () => {
            return ` SELECT  tblProdBike.id,
            tblProdBike.bike_name,
            coalesce(tbllock.device_last_request_time, tbllock.lastdevicerequesttime) as device_last_request_time,
            tbllock.lock_number ,
            tblProdBike.lock_id,
            tbllock.deveice_state_enum_id ,
            (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tbllock.deveice_state_enum_id ) as deveice_status,
           tbllock.device_lock_and_unlock_status,
           (select dls.name from  masters.tbl_device_lock_status dls where  dls.id =tbllock.device_lock_and_unlock_status ) as device_lock_unlock_status,
           tbllock.instruction_id ,
           (select display_name from masters.tbl_device_instractions where id = tbllock.instruction_id)  instruction_name ,
           tblProdBike.bike_booked_status,
           (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tblProdBike.bike_booked_status) as bike_booked_status_name,
           tbllock.location ,
           tbllock.latitude ,
           tbllock.longitude ,
           tbllock.altitude ,
           (select tbzd.name from masters.tbl_zone_detail tbzd where tbzd.id=tblProdBike.zone_id) as zone_name ,
           tbllock.device_light_status_enum_id ,
           (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tbllock.device_light_status_enum_id)as deveice_light_status,
           tbllock.device_light_instruction_enum_id , 
          (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tbllock.device_light_instruction_enum_id)as device_light_instruction,
          tbllock.battery,
          tbllock.beep_status_enum_id ,
          (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tbllock.beep_status_enum_id)as beep_status_name,
          tbllock.beep_instruction_enum_id , 
          (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tbllock.beep_instruction_enum_id)as beep_instruction_name,
          tblProdBike.geofence_inout_enum_id,
          (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tblProdBike.geofence_inout_enum_id)as geofence_inout_name          
          FROM inventory.tbl_product_bike tblProdBike
                       
                   inner join   inventory.tbl_lock_detail tbllock on 
                   tblProdBike.lock_id = tbllock.id                  
                                 
                   where tblProdBike.bike_booked_Status = 35 and tblProdBike.status_enum_id =1
                   and (tblProdBike.zone_id = $1 OR $1 =0)`;
        } ,

        
        getOutSideGeoFanceBikeListQ: () => {
            return ` 	 SELECT  tblProdBike.id,          
            coalesce(tbllock.device_last_request_time, tbllock.lastdevicerequesttime) as device_last_request_time,
            tbllock.lock_number ,
            tblProdBike.lock_id,
            tblProdBike.bike_name,
            tblProdBike.bike_booked_status,
            (select tblenum.enum_key from public.tbl_enum tblenum where tblenum.enum_id=tblProdBike.bike_booked_status) as bike_booked_status_name,

            tbllock.deveice_state_enum_id ,

            (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tbllock.deveice_state_enum_id ) as deveice_status,
           tbllock.device_lock_and_unlock_status,
           (select dls.name from  masters.tbl_device_lock_status dls where  dls.id =tbllock.device_lock_and_unlock_status ) as device_lock_unlock_status,
           tbllock.instruction_id ,
           (select display_name from masters.tbl_device_instractions where id = tbllock.instruction_id)  instruction_name ,

           tbllock.location ,
           tbllock.latitude ,
           tbllock.longitude ,
           tbllock.altitude ,
           (select tbzd.name from masters.tbl_zone_detail tbzd where tbzd.id=tblProdBike.zone_id) as zone_name ,
           tbllock.device_light_status_enum_id ,
           (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tbllock.device_light_status_enum_id)as deveice_light_status,
           tbllock.device_light_instruction_enum_id , 
          (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tbllock.device_light_instruction_enum_id)as device_light_instruction,
          tbllock.battery,
          tbllock.beep_status_enum_id ,
           (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tbllock.beep_status_enum_id)as beep_status_name,
           tbllock.beep_instruction_enum_id , 
           (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tbllock.beep_instruction_enum_id)as beep_instruction_name,
		   rd.ride_booking_no ,
           tblProdBike.bike_booked_status,
           (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tblProdBike.bike_booked_status) as bike_booked_status_name,
		   ar.id as area_id ,
           ar.name as area_name ,
		   ar.map_draw_object_enum_id  as area_map_draw_object_enum_id,
          (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =ar.map_draw_object_enum_id )  area_map_draw_object_status ,
           ar.map_draw_object as area_map_draw_object,
		   ar.map_draw_object_address as  area_map_draw_object_address,
		    cities.map_city_name ,
            cities.user_city_name ,
           cities.map_city_id, 
			 cities.map_draw_object_enum_id ,
            (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =cities.map_draw_object_enum_id )  map_draw_object_status ,
             cities.map_draw_object ,
             cities.map_draw_object_address ,
             ad.user_name ,
			ad.mobile ,
             tblProdBike.geofence_inout_enum_id,
             (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tblProdBike.geofence_inout_enum_id)as geofence_inout_name 
             FROM  inventory.tbl_lock_detail tbllock                        
            inner join inventory.tbl_product_bike tblProdBike   on 
             tblProdBike.lock_id = tbllock.id  
			left join admin.tbl_ride_booking rd on 
			 rd.vehicle_lock_id =tbllock.id and tblProdBike.id = rd.bike_id 
             and rd.bike_rideing_status=16
		     left join masters.tbl_area ar on 
			 ar.id = tbllock.area_id 
			 left join masters.tbl_map_city cities on
			 cities.map_city_id = tbllock.map_city_id           
			 left join  admin.tbl_admin ad on 
			 ad.id =rd.user_id
                   where 
                   tblProdBike.status_enum_id =1 and tblProdBike.geofence_inout_enum_id = 63 and 
                    (tblProdBike.zone_id = $1 OR $1 =0)
                  `;
        },

        getOutSideGeoFanceBikeListMaCitySearchQ: () => {
            return ` SELECT  tblProdBike.id,          
            coalesce(tbllock.device_last_request_time, tbllock.lastdevicerequesttime) as device_last_request_time,
            tbllock.lock_number ,
            tblProdBike.lock_id,
            tblProdBike.bike_name,
            tblProdBike.bike_booked_status,
            (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tblProdBike.bike_booked_status) as bike_booked_status_name,
     
            tbllock.deveice_state_enum_id ,

            (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tbllock.deveice_state_enum_id ) as deveice_status,
           tbllock.device_lock_and_unlock_status,
           (select dls.name from  masters.tbl_device_lock_status dls where  dls.id =tbllock.device_lock_and_unlock_status ) as device_lock_unlock_status,
           tbllock.instruction_id ,
           (select display_name from masters.tbl_device_instractions where id = tbllock.instruction_id)  instruction_name ,

           tbllock.location ,
           tbllock.latitude ,
           tbllock.longitude ,
           tbllock.altitude ,
           (select tbzd.name from masters.tbl_zone_detail tbzd where tbzd.id=tblProdBike.zone_id) as zone_name ,
           tbllock.device_light_status_enum_id ,
           (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tbllock.device_light_status_enum_id)as deveice_light_status,
           tbllock.device_light_instruction_enum_id , 
          (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tbllock.device_light_instruction_enum_id)as device_light_instruction,
          tbllock.battery,
          tbllock.beep_status_enum_id ,
           (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tbllock.beep_status_enum_id)as beep_status_name,
           tbllock.beep_instruction_enum_id , 
           (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tbllock.beep_instruction_enum_id)as beep_instruction_name,
		   rd.ride_booking_no ,
		   ar.id as area_id ,
           ar.name as area_name ,
		   ar.map_draw_object_enum_id  as area_map_draw_object_enum_id,
          (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =ar.map_draw_object_enum_id )  area_map_draw_object_status ,
           ar.map_draw_object as area_map_draw_object,
		   ar.map_draw_object_address as  area_map_draw_object_address,
		    cities.map_city_name ,
            cities.user_city_name ,
           cities.map_city_id, 
			 cities.map_draw_object_enum_id ,
            (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =cities.map_draw_object_enum_id )  map_draw_object_status ,
             cities.map_draw_object ,
             cities.map_draw_object_address,
             tblProdBike.geofence_inout_enum_id,
             (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tblProdBike.geofence_inout_enum_id)as geofence_inout_name  ,
             tbllock.power_on_off_status_enum_id ,
           (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tbllock.power_on_off_status_enum_id)as power_on_off_status 
 
            FROM  inventory.tbl_lock_detail tbllock                        
            inner join inventory.tbl_product_bike tblProdBike   on 
             tblProdBike.lock_id = tbllock.id  
			left join admin.tbl_ride_booking rd on 
			 rd.vehicle_lock_id =tbllock.id and tblProdBike.id = rd.bike_id 
             and rd.bike_rideing_status=16
             left join masters.tbl_zone_detail zd on
             tblProdBike.zone_id = zd.id 
             left join masters.tbl_area ar on 
             zd.area_id = ar.id
             left join masters.tbl_map_city cities on   
             cities.map_city_id=ar.map_city_id 
             left join masters.tbl_map_state states on
             states.map_state_id =cities.map_state_id
             left join masters.tbl_map_country countrys on
             countrys.map_country_id =states.map_country_id            
             where  tblProdBike.geofence_inout_enum_id = 63 
             and tblProdBike.status_enum_id =1 and    
             
             ( UPPER(TRIM(countrys.map_country_name)) = UPPER(TRIM($1)) OR $1='' ) and 
             ( UPPER(TRIM(states.map_state_name)) =  UPPER(TRIM($2)) OR $2 ='' ) 
            and (   UPPER(TRIM(cities.map_city_name)) = UPPER(TRIM($3)) OR $3='' OR   UPPER(TRIM(cities.user_city_name)) = UPPER(TRIM($3))) 
            --and  (tblProdBike.zone_id = $4 OR $4 =0)                  `;
        },
       
    },
    allotment: {
        getZoneWiseDetails: () => {
            return `SELECT tblzone.id, 
            tblzone.vehicle_model_id,
            (SELECT tblveh.model_name from  masters.tbl_vehicle_model  tblveh  WHERE  tblveh.id =  tblzone.vehicle_model_id ) as model_name,
            tblzone.uid,
            (SELECT tblveh.model_uid from  inventory.tbl_uid  tblveh  WHERE  tblveh.id =  tblzone.uid ) as uid_number,
            tblzone.zone_id,
            (SELECT tblveh.name from  masters.tbl_zone_detail tblveh  WHERE  tblveh.id =  tblzone.zone_id ) as zone_name,
            tblzone.status_enum_id,
            (select tblstatus.enum_key from tbl_enum tblstatus where tblstatus.enum_id = tblzone.status_enum_id) as status_name,
            tblzone.createdon_date
            FROM inventory.tbl_bike_allotment_zone_wise tblzone
            WHERE (tblzone.zone_id = $1 or $1 = 0)
            order by tblzone.id desc`;
        },
        getZoneListByBikeAllotment: () => {
            return `tblzone.zone_id,
            (SELECT tblveh.name from  masters.tbl_zone_detail tblveh  WHERE  tblveh.id =  tblzone.zone_id ) as zone_name,
            FROM inventory.tbl_bike_allotment_zone_wise tblzone
            WHERE (tblzone.zone_id = $1 or $1 = 0) and tblzone.status_enum_id = 1
            order by tblzone.id desc`;
        },
        insertBikeAllotment: () => {
            return `INSERT INTO inventory.tbl_bike_allotment_zone_wise(
                 vehicle_model_id, uid, zone_id, status_enum_id, remarks, createdby_login_user_id, createdby_user_type_enum_id,createdon_date ,bike_id, lock_id)
                VALUES ($1, $2, $3, $4, $5, $6, $7,$8,$9,$10) RETURNING id;`;
        },

        //update inventory.tbl_bike_allotment_zone_wise  set status_enum_id=2 where id = $1
        deActiveAllotmentBike: () => {
            return `update inventory.tbl_bike_allotment_zone_wise  set status_enum_id=$4,updated_login_user_id=$2,updatedon_date=$3 where id = $1`;
        },
        getBikeAllotmentDataForEdit: () => {
            return `select vehicle_model_id, uid from  inventory.tbl_bike_allotment_zone_wise  where id = $1`;
        },
        getBikeForAllotment: () => {
            return `select id , lock_id from  inventory.tbl_product_bike where model_id = $1 and uid_id = $2 and status_enum_id = 1 order by id desc limit 1`;
        },

        updateBikeAllotment: () => {
            return `UPDATE inventory.tbl_bike_allotment_zone_wise
            SET  vehicle_model_id=$1, uid=$2, zone_id=$3, status_enum_id=$4,  action_remarks=$5, updated_login_user_id=$6, updatedby_user_type_enum_id=$7,updatedon_date=$8
            WHERE id=$9;`;
        },

        getAllotmentDetails: () => {
            return `SELECT tblzone.id, 
            tblzone.vehicle_model_id,
            (SELECT tblveh.model_name from  masters.tbl_vehicle_model  tblveh  WHERE  tblveh.id =  tblzone.vehicle_model_id ) as model_name,
            tblzone.uid,
            (SELECT tblveh.model_uid from  inventory.tbl_uid  tblveh  WHERE  tblveh.id =  tblzone.uid ) as uid_number,
            tblzone.zone_id,
            (SELECT tblveh.name from  masters.tbl_zone_detail tblveh  WHERE  tblveh.id =  tblzone.zone_id ) as zone_name,
            (SELECT tblveh.zone_address from  masters.tbl_zone_detail tblveh  WHERE  tblveh.id =  tblzone.zone_id ) as zone_address,
            tblzone.status_enum_id,
            (select tblstatus.enum_key from tbl_enum tblstatus where tblstatus.enum_id = tblzone.status_enum_id) as status_name,
            tblzone.remarks,
            tblzone.action_remarks, 
            tblzone.createdon_date,
            tblzone.createdby_login_user_id,
            tblzone.createdby_user_type_enum_id, 
            tblzone.updated_login_user_id, 
            tblzone.updatedon_date,
            tblzone.updatedby_user_type_enum_id ,
			tblProdBike.bike_name,
			tblProdBike.id as bike_id ,
			tbllock.lock_number,
			tbllock.id as lock_id ,
			ar.name as area_name ,
			ar.id as area_id ,
            ar.area_type_enum_id,
            (select tblstatus.enum_key from tbl_enum tblstatus where tblstatus.enum_id = ar.area_type_enum_id) as area_enum_type_name,
			city.map_city_id ,
			city.map_city_name,
			st.map_state_id , 
			st.map_state_name 
            FROM inventory.tbl_bike_allotment_zone_wise  tblzone
			left join inventory.tbl_product_bike tblProdBike on
			tblProdBike.id = tblzone.bike_id and tblProdBike.status_enum_id = 1
			left join   inventory.tbl_lock_detail tbllock on 
             tblProdBike.lock_id = tbllock.id  and tbllock.status_enum_id =1
			left join masters.tbl_zone_detail zd on 
			zd.id = tblProdBike.zone_id 
			left join masters.tbl_area ar on
			zd.area_id = ar.id 
			left join masters.tbl_map_city city on 
			city.map_city_id = ar.map_city_id 
			left join masters.tbl_map_state st on 
			city.map_state_id = st.map_state_id 
            WHERE (tblzone.id =  $1 or $1 = 0 ) AND (tblzone.status_enum_id =  $2 or $2 = 0 )
            order by tblzone.id desc;`;
        },
        activeInactiveAllotment: () => {
            return `UPDATE inventory.tbl_bike_allotment_zone_wise SET status_enum_id = $1 WHERE id = $2`;
        },
        checkSameCombinationBikeNotAlloted: () => {
            return `select id from  inventory.tbl_bike_allotment_zone_wise where    uid=$1 and vehicle_model_id = $2 and status_enum_id =1 and id<>$3`;
        },
        getLockDetailForTestPage: () => {
            return `select lockd.id , 
            lockd.battery,
            lockd.lock_number,
            lockd.status_enum_id ,
           (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =lockd.status_enum_id)as status,
           lockd.createdon_date ,
           coalesce(lockd.latitude,'') as latitude,
           coalesce(lockd.longitude,'') as longitude,
            coalesce(lockd.altitude,'') as altitude,  
            coalesce(lockd.speed,'') as speed,       
            lockd.registartion_status ,                    
           coalesce(lockd.internal_batt_v,'') as internal_batt_v,
           coalesce(lockd.external_batt_v,'') as external_batt_v,
           lockd.device_lock_and_unlock_status ,
           (select name from masters.tbl_device_lock_status where id = lockd.device_lock_and_unlock_status) lock_status ,
           lockd.instruction_id ,
           (select display_name from masters.tbl_device_instractions where id = lockd.instruction_id)  instruction_name ,
           lockd.allotment_status_id ,
           (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =lockd.allotment_status_id)as allotment_status,
           lockd.deveice_state_enum_id,
           (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =lockd.deveice_state_enum_id)as deveice_state,
           lockd.device_light_status_enum_id ,
           (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =lockd.device_light_status_enum_id)as device_light_status,
           lockd.device_light_instruction_enum_id , 
           (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =lockd.device_light_instruction_enum_id)as device_light_instruction,
           coalesce(lockd.device_last_request_time),           
           lockd.imei_number as lock_imei_number,
           lockd.lastupdateddateforlatlong,
           lockd.lastupdateddateforbatterypercentage,
           lockd.lastupdateddateforinternalbatteryvolt,
           lockd.lastupdateddateforexternalbatteryvolt,
           lockd.lastupdateddateforspeed,
           lockd.lastupdateddateforlockunlock,
           lockd.lastupdateddateforlightonoff,
           lockd.lastupdateddateforaltitude ,
           lockd.beep_status_enum_id ,
           lockd.lastupdateddateforbeeponoff,
           (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =lockd.beep_status_enum_id)as beep_status_name,
           lockd.beep_instruction_enum_id , 
           (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =lockd.beep_instruction_enum_id)as beep_instruction_name,
           tblProdBike.bike_booked_status,
           (select tblenum.enum_key from public.tbl_enum tblenum where tblenum.enum_id=tblProdBike.bike_booked_status) as bike_booked_status_name
           from inventory.tbl_lock_detail lockd                      
           left join inventory.tbl_product_bike tblProdBike on
           lockd.id = tblProdBike.lock_id and tblProdBike.status_enum_id = 1
           where (lockd.lock_number LIKE '%' || $1 || '%' OR $1='' )           
           and (lockd.device_lock_and_unlock_status = $2 OR $2=0)
           and  (lockd.device_light_status_enum_id = $3 OR $3=0) 
           and  (lockd.beep_status_enum_id = $4 OR $4=0)            
           order by lockd.id desc`
    },
    },
    payment: {
        insertPaymentTransaction: () => {
            return `INSERT INTO admin.tbl_payment_transaction_details(
                user_id, payment_id, entity, amount, currency, status, order_id, invoice_id, international, method, amount_refunded,
                refund_status, captured, description, card_id, bank, wallet, vpa, email, contact, notes, 
                fee, tax, error_code, error_description, error_source, error_step, error_reason, acquirer_data, created_at, createdon_date,card,event,
                online_payment_status_enum_id,createdby_login_user_id, payment_order_no)
               VALUES ( $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31,$32,$33,$34,$35,$36) RETURNING id;`;
        },

        insertPaymentTransactionByOrderApi: () => {
            return `INSERT INTO admin.tbl_payment_transaction_details(
                user_id, entity,amount, currency, status, order_id, email, contact,created_at, createdon_date,
                online_payment_status_enum_id,receipt,createdby_login_user_id, payment_order_no,remarks ,error_code, error_description, error_source, error_step, error_reason,order_response_json)
               VALUES ( $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,$13,$14,$15 ,$16, $17, $18, $19, $20,$21) RETURNING id;`;
        },

        insertWithdrawTransaction: () => {
            return `INSERT INTO admin.tbl_withdraw_transaction_details(
                 user_id, account_number, amount, currency, mode, purpose, fund_account, account_type,contact, queue_if_low_balance, reference_id, narration, notes, created_at, createdon_date)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING id;`;
        } ,

        getPaymentTransactionId: () => {
            return `select id, payment_id ,online_payment_status_enum_id , order_id from   admin.tbl_payment_transaction_details where order_id = $1 OR  receipt = $2`;
        } ,

        getPaymentTransactionIdAddPayment: () => {
            return `select id, payment_id ,online_payment_status_enum_id , order_id from   admin.tbl_payment_transaction_details where order_id = $1 `;
        } ,
        getPaymentTransactionForUpdateValueId: () => {
            return `select id,user_id,amount, status, order_id, email, contact, createdon_date,
                online_payment_status_enum_id,receipt,createdby_login_user_id , payment_order_no
                from  admin.tbl_payment_transaction_details where online_payment_status_enum_id =33 AND  createdon_date::date > '2024-07-31'::date;`;  //order by id asc limit 10 ,2068)// createdon_date::date > '2024-07-26'::dat  //and user_id in (301,305,3578,3742 ,2068)//  33 unsetteled add one more condition for create on date;
        } ,

        UPaymentTransactionFromVerifyController: () => {

            return `update admin.tbl_payment_transaction_details set 
                user_id = $2 , payment_id = $3, entity = $4, remarks = $5, currency= $6, status = $7, invoice_id = $9, international = $10, method= $11, amount_refunded= $12,
                refund_status= $13, captured = $14, description= $15, card_id = $16, bank= $17, wallet= $18, vpa = $19, email= $20, contact= $21, notes=$22, 
                fee = $23, tax= $24, error_code= $25, error_description= $26, error_source= $27, error_step= $28, error_reason= $29, acquirer_data= $30, card= $31,event= $32,
                online_payment_status_enum_id= $33 ,updatedon_date = $34 ,razapay_response_json =$35 ,razorpay_response_from_scheduler =$36
                where id = $1 and order_id = $8`;
        },

        UPaymentTransactionFromVerifyFromOrderFailedController: () => {

            return `update admin.tbl_payment_transaction_details set 
                        online_payment_status_enum_id= $3 ,updatedon_date = $4, remarks = $2 ,
                        razorpay_response_from_scheduler = $5
                where id = $1`;
        },
        // webhooksResponseForPaymentTransaction: () => {
        //     return `INSERT INTO admin.tbl_webhooks_payment_transaction_details(
        //          webhooks_response, createdon_date)
        //         VALUES ($1,$2);`;
        // }
    },
    rideBooking: {
        insertRideBooking: () => {

            return `INSERT INTO admin.tbl_ride_booking(
                user_id, vehicle_model_id, vehicle_uid_id, vehicle_lock_id, ride_booking_min,from_ride_time, to_ride_time, ride_payment_status, hiring_charges, pervious_charges, createdon_date, status_enum_id,payment_id,ride_start_latitude,ride_start_longitude,
                bike_id,minimum_hiring_time,minimum_rent_rate,fare_plan_id,ride_start_address, ride_start_external_battery_voltage ,ride_start_internal_battery_voltage ,ride_start_zone_id,ride_booking_no,beep_on_count,beep_off_count,area_id,map_city_id,distance_in_meters, 
                ride_start_ext_battery_percentage,ride_rating)
               VALUES ($1, $2, $3, $4, $5, $6, $7 , $8, $9, $10, $11, $12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31) RETURNING id;`;

        //     fare_plan_id return `INSERT INTO admin.tbl_ride_booking(
        //          user_id, vehicle_model_id, vehicle_uid_id, vehicle_lock_id, ride_booking_min,from_ride_time, to_ride_time, ride_payment_status, hiring_charges, pervious_charges, createdon_date, status_enum_id,payment_id,ride_start_latitude,ride_start_longitude)
        //         VALUES ($1, $2, $3, $4, $5, $6, $7 , $8, $9, $10, $11, $12,$13,$14,$15) RETURNING id;`;
         },

       addRidebookingRating:()=>
         {
            return  `update admin.tbl_ride_booking  
                     set ride_rating = $1,
                         ride_comments = $2,
                         comments_reply_status_enum_id = $3
                     where id = $4`
         },

         addRidebookingCommentsReply:()=>
         {
            return  `update admin.tbl_ride_booking  
                     set ride_Comments_reply = $1,
                     comments_reply_status_enum_id = $2,
                     comments_reply_date = $4
                     where id = $3`
         },


         addRidebookingLatLogJson:()=>
         {
            return  `update admin.tbl_ride_booking  
                     set latitude_longitude_json = latitude_longitude_json::jsonb || $1 ,current_latitude = $3 ,current_longitude = $4
                     ,distance_in_meters =coalesce(distance_in_meters,0) + $5
                     where id = $2`
         },

         
        getRideBookingDetailForCommentsReply: () => 
        {   
            return `select 
    rb.id,
	rb.user_id,
    ad.user_name,
    ad.mobile,	
    rb.vehicle_model_id,
    rb.vehicle_uid_id,
	(select tblvehmod.model_name  FROM masters.tbl_vehicle_model tblvehmod where tblvehmod.id= rb.vehicle_model_id limit 1)as model_name,
    (select tblvehmod.model_uid FROM inventory.tbl_uid tblvehmod where tblvehmod.id = rb.vehicle_uid_id limit 1) model_uid_number,
     rb.vehicle_lock_id,
	(select tblvehmod.lock_number  FROM inventory.tbl_lock_detail tblvehmod where tblvehmod.id= rb.vehicle_lock_id limit 1) as lock_number,
    rb.ride_booking_min ,
    rb.from_ride_time ,
    rb.to_ride_time ,
    rb.actual_ride_time ,
    rb.actual_ride_min ,
    rb.total_ride_amount  ,
    rb.ride_start_latitude,
    rb.ride_start_longitude,
    rb.ride_end_latitude,
    rb.ride_end_longitude,
    rb.bike_rideing_status  ,
	rb.minimum_hiring_time ,
    rb.minimum_rent_rate ,
    rb.end_ride_user_id ,

    (select ad.user_name from admin.tbl_admin  ad where ad.id = rb.end_ride_user_id limit 1 ) end_ride_user_name,
    tbllock.deveice_state_enum_id ,
    (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tbllock.deveice_state_enum_id limit 1) as deveice_status,
   tbllock.device_lock_and_unlock_status,

   (select dls.name from masters.tbl_device_lock_status dls where  dls.id =tbllock.device_lock_and_unlock_status limit 1 ) as device_lock_unlock_status,
   tbllock.instruction_id ,
   (select display_name from masters.tbl_device_instractions where id = tbllock.instruction_id limit 1)  instruction_name ,
   tbllock.location ,
   tbllock.latitude ,
   tbllock.longitude ,
   tbllock.altitude ,
   tbllock.battery  ,
    coalesce(tbllock.device_last_request_time, tbllock.lastdevicerequesttime) as device_last_request_time,
   tbllock.device_light_status_enum_id ,
    (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tbllock.device_light_status_enum_id)as deveice_light_status,
    tbllock.device_light_instruction_enum_id , 
   (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tbllock.device_light_instruction_enum_id)as device_light_instruction ,
   tbllock.beep_status_enum_id ,
   (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tbllock.beep_status_enum_id)as beep_status_name,
   tbllock.beep_instruction_enum_id , 
   (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tbllock.beep_instruction_enum_id)as beep_instruction_name,
   
   tblProdBike.geofence_inout_enum_id,
   (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tblProdBike.geofence_inout_enum_id)as geofence_inout_name ,
 
tblProdBike.id  as bike_id,
     tblProdBike.bike_name,
    rb.ride_booking_no ,
    rb.ride_start_zone_id, 
(select name from masters.tbl_zone_detail where id =rb.ride_start_zone_id) ride_start_zone,
rb.ride_end_zone_id, 
(select name from masters.tbl_zone_detail where id =rb.ride_end_zone_id) ride_end_zone,
    rb.ride_rating ,rb.ride_comments ,rb.ride_Comments_reply ,rb.comments_reply_status_enum_id,
    (select enum_key from public.tbl_enum where  enum_id =rb.comments_reply_status_enum_id) as comments_reply_status_name
	from admin.tbl_ride_booking rb
    inner join inventory.tbl_product_bike tblProdBike on
    tblProdBike.id = rb.bike_id and tblProdBike.status_enum_id =1
    inner join   inventory.tbl_lock_detail tbllock on 
    tblProdBike.lock_id = tbllock.id
    inner join admin.tbl_admin  ad 
    on ad.id = rb.user_id
	where 
     (rb.from_ride_time  between $1 and $2 ) and 
     (rb.ride_rating =ANY($3::bigint[]) or $3= '{}')     
	and (rb.comments_reply_status_enum_id = $4 OR $4=0)    
  and (UPPER(TRIM(ad.user_name)) LIKE '%' || UPPER(TRIM($5)) || '%' OR $5='')
  and (ad.mobile = $6 or $6='')
  and rb.bike_rideing_status = '15'`
        },

         getUserTypeEnumId: () => {
            return `select user_type_enum_id  from  admin.tbl_admin  WHERE id = $1 limit 1`;
        },
        addWalletAmount: () => {
            return `UPDATE admin.tbl_admin SET min_wallet_amount = min_wallet_amount + $1 ,extra_charges=$2 ,updatedon_date = $3 , subsequently_ride_status=1, user_driving_status = 18 WHERE id = $4`;
        },
        getWalletAmount: () => {
            return `select min_wallet_amount, deposit_amount ,extra_charges from  admin.tbl_admin  WHERE id = $1`;
        },
        updateBikeReservedAndUnReservedStatus: () => {
            return `update inventory.tbl_product_bike set  bike_booked_status=$4, zone_id=$5 where model_id = $1 and uid_id = $2 and lock_id = $3;`;
        },
        previousCharges: () => {
            return `SELECT *
            FROM  admin.tbl_ride_booking
            WHERE id IN (SELECT id FROM  admin.tbl_ride_booking WHERE   createdon_date = (SELECT MAX(createdon_date) FROM admin.tbl_ride_booking))
			and user_id = $1
            ORDER BY user_id DESC
            LIMIT 1
            `;
        },
        UpdateExtraCharges: () => {
            return `UPDATE admin.tbl_admin SET extra_charges = $1,  updatedon_date = $3 , user_driving_status=19 WHERE id = $2 `;
        },
        
        updateActualTimeTake: () => {
            return `UPDATE admin.tbl_ride_booking  SET actual_ride_time = $1 ,actual_ride_min = $4, extra_ride_charges=$5, total_ride_amount=$6, updatedon_date =$3, ride_end_latitude =$7,
               ride_end_longitude=$8, bike_rideing_status=15 ,
               remark = $9 ,
               end_ride_user_id =$10,
               ride_end_address =$11,
               ride_end_zone_id =$12,
               ride_end_internal_battery_voltage =$13,
               ride_end_external_battery_voltage  =$14	,
               light_off_count = light_off_count + $15, 
               device_lock_count = device_lock_count + $16  ,
               ride_end_ext_battery_percentage =$17            	
               WHERE  id =$2`;
        },
        getRideBookingDetails: () => {
            return `SELECT tblride.id, tblride.user_id,
            (select tbladmin.user_name from admin.tbl_admin tbladmin  where tbladmin.id = tblride.user_id) as user_name,
            (select tbladmin.min_wallet_amount from admin.tbl_admin tbladmin  where tbladmin.id = tblride.user_id) as min_wallet_amount,
            (select tbladmin.deposit_amount from admin.tbl_admin tbladmin  where tbladmin.id = tblride.user_id) as deposit_amount,
            (select tbladmin.extra_charges from admin.tbl_admin tbladmin  where tbladmin.id = tblride.user_id) as extra_charges,
            tblride.vehicle_model_id, 
            (select tblvehmod.model_name  FROM masters.tbl_vehicle_model tblvehmod where tblvehmod.id= tblride.vehicle_model_id )as model_name,
            tblride.vehicle_uid_id,
            (select tblvehmod.model_uid FROM inventory.tbl_uid tblvehmod where tblvehmod.id = tblride.vehicle_uid_id) model_uid_number,
            tblride.vehicle_lock_id,
            (select tblvehmod.lock_number  FROM inventory.tbl_lock_detail tblvehmod where tblvehmod.id= tblride.vehicle_lock_id ) as lock_number,
            tblride.ride_booking_min,
            tblride.from_ride_time,
            tblride.to_ride_time,
            tblride.actual_ride_time, 
            tblride.actual_ride_min, 
            tblride.ride_payment_status, 
            tblride.hiring_charges, 
            tblride.pervious_charges, 
            tblride.createdon_date, 
            tblride.updatedon_date, 
            tblride.status_enum_id,
            tblride.payment_id,
            (select tbladmin.payment_id from admin.tbl_payment_transaction_details tbladmin  where tbladmin.id = tblride.payment_id) as payment,
            tblride.extra_ride_charges ,
            tblride.total_ride_amount,
            cast((coalesce(tblride.distance_in_meters,0)) as numeric)/1000 as distance_in_meters ,
            tblride.ride_start_latitude,
            tblride.ride_start_longitude, 
            tblride.ride_end_latitude,
            tblride.ride_end_longitude,
            tblride.bike_rideing_status,
            (select tblstatus.enum_key from tbl_enum tblstatus where tblstatus.enum_id = tblride.bike_rideing_status) as bike_rideing_status_name ,
            tblride.bike_id
            FROM admin.tbl_ride_booking tblride WHERE 
            (tblride.id = $1 or $1 = 0 )  AND 
            (tblride.status_enum_id = $2  or $2 = 0) AND 
            (tblride.user_id = $3  or $3 = 0)  
            and  tblride.bike_rideing_status =16 
            order by tblride.id desc
            limit 1
            ---LIMIT 5 OFFSET (1 - 1) * 5
            ;`;
        },
        getRideBookingHiringCharges: () => {
            return `select tblride.id, tblride.user_id,tblride.hiring_charges , tblride.ride_booking_min, tblride.from_ride_time, tblride.to_ride_time, tblride.actual_ride_time from  admin.tbl_ride_booking tblride where tblride.user_id = $1  and  tblride.id=$2 
                    `;
        },
        getRideBookingExtraCharges: () => {
            return ` select tblride.id, tblride.user_id,tblride.extra_ride_charges ,(tblride.actual_ride_min - tblride.ride_booking_min) as extra_ride_min , tblride.from_ride_time, tblride.to_ride_time, tblride.actual_ride_time from  admin.tbl_ride_booking tblride where tblride.user_id = $1 and tblride.id=$2 
          
                    `;
        },
        getRideBookingTotalCharges: () => {
            return `   select tblride.id, tblride.user_id,tblride.total_ride_amount ,tblride.actual_ride_min as total_ride_min, tblride.from_ride_time, tblride.to_ride_time, tblride.actual_ride_time from  admin.tbl_ride_booking tblride where tblride.user_id = $1 and  tblride.id=$2 `;
        },
        getLastMinAmount: () => {
            return `select enum_key::int from public.tbl_enum   WHERE enum_id= 25`;
        },
        
        getLastMinRechargeAmount: () => {
            return `select enum_key::int from public.tbl_enum   WHERE enum_id= 107`;
        },

        getLastDepositAmount: () => {
            return `select enum_key::int from public.tbl_enum   WHERE enum_id= 25`;
        },
        // getBikeDetail:()=>{
        //     return 'select model_id , lock_id , uid_id,bike_booked_status,zone_id from inventory.tbl_product_bike where id =$1 ;'
        // },
        

        findNearestZone: () =>{
            return `select zone.id from masters.tbl_zone_detail zone
            where ST_DWithin(ST_GeogFromText('POINT('|| $1 ||')'),
            ST_GeogFromText('POINT('|| CONCAT( zone.latitude,' ',zone.longitude)||')'), COALESCE((select cast(enum.enum_key as numeric(32,16)) from public.tbl_enum enum where enum.enum_type_name ='Vehicle Stand Redius (meter)' limit 1),0) )`;
       },
        getBikeDetail: () => {
            return `SELECT 
            pb.id,
            pb.model_id , 
            pb.lock_id , 
            pb.uid_id,
            pb.bike_booked_status,
            pb.zone_id               
            from inventory.tbl_product_bike pb          
           where  pb.id = $1;`;
        },

        getBikeOtherBikeAtSameLocke: () => {
            return `SELECT * from inventory.tbl_product_bike  where  id <> $1 and lock_id =$2 and status_enum_id =$3
            `;
        },

        getBikeOtherBikeAtSameUId: () => {
            return `SELECT * from inventory.tbl_product_bike  where  id <> $1 and uid_id =$2 and status_enum_id =$3
            `;
        },

        getUserRideingStatus:()=>
        {
            return 'select bike_rideing_status  from admin.tbl_ride_booking where user_id = $1 and bike_rideing_status = 16 limit 1'
        },

        subWalletAmount: () => {
            return `UPDATE admin.tbl_admin SET min_wallet_amount = min_wallet_amount - $1  WHERE id = $2`;
        },
        subDepositAmount: () => {
            return `UPDATE admin.tbl_admin SET deposit_amount = deposit_amount - $1  WHERE id = $2`;
        },
        addDepositAmountFromWithdrawRequestCancel: () => {
            return `UPDATE admin.tbl_admin SET deposit_amount = deposit_amount + $1  WHERE id = $2`;
        },
        getLockDetailForRideStartQuery:()=>{
            return `select latitude ,longitude ,battery,speed ,internal_batt_v ,external_batt_v, 
            device_light_status_enum_id ,
            device_lock_and_unlock_status , 
            (select name from masters.tbl_device_lock_status where id = device_lock_and_unlock_status) lock_status ,
            deveice_state_enum_id,
           (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =deveice_state_enum_id)as deveice_state ,
           power_on_off_status_enum_id ,
           lock_number
            from inventory.tbl_lock_detail  where id = $1`
        } ,
         checkRideStartOrNotForUser: () => {
            return `select  tblride.bike_rideing_status,
            (select tblstatus.enum_key from tbl_enum tblstatus where tblstatus.enum_id = tblride.bike_rideing_status) as bike_rideing_status_name
            FROM admin.tbl_ride_booking tblride   WHERE                           
            (tblride.user_id = $1)
			and tblride.bike_rideing_status = 16 ;`;
        }, 
  
        getRideBookingDetailsForRideEnd: () => {
            return `SELECT 
            tblride.id,  
            tblride.bike_id,
            tblride.ride_booking_no,
            tblride.minimum_hiring_time,tblride.minimum_rent_rate,tblride.fare_plan_id,
            tblride.from_ride_time  ,  
            tblride.actual_ride_time ,     
            (select tbladmin.min_wallet_amount from admin.tbl_admin tbladmin  where tbladmin.id = tblride.user_id) as min_wallet_amount,
            tblride.vehicle_model_id, 
            (select tblvehmod.model_name  FROM masters.tbl_vehicle_model tblvehmod where tblvehmod.id= tblride.vehicle_model_id )as model_name,
            tblride.vehicle_uid_id,
            (select tblvehmod.model_uid FROM inventory.tbl_uid tblvehmod where tblvehmod.id = tblride.vehicle_uid_id) model_uid_number,
            tblride.vehicle_lock_id,
            (select tblvehmod.lock_number  FROM inventory.tbl_lock_detail tblvehmod where tblvehmod.id= tblride.vehicle_lock_id ) as lock_number,                                  
            tblride.bike_rideing_status,
            (select tblstatus.enum_key from tbl_enum tblstatus where tblstatus.enum_id = tblride.bike_rideing_status) as bike_rideing_status_name
            FROM admin.tbl_ride_booking tblride WHERE 
            (tblride.id = $1 or $1 = 0 )   
            --(tblride.status_enum_id = $2  or $2 = 0) AND 
            --(tblride.user_id = $3  or $3 = 0)
            order by tblride.id desc
            ---LIMIT 5 OFFSET (1 - 1) * 5
            ;`;
        },

        bikeUnderMantenancesHistory:()=>
        {
            return `insert into masters.tbl_bike_undermaintenance_history
         (bike_id, vehicle ,uid ,lock_no,bike_status_enum_id,remarks  , createdon_date ,created_by_id, status_enum_id)
        values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`
        },

       updateBikeStatusMantenances:()=>
       {
       return `update inventory.tbl_product_bike set  bike_booked_status = $5  WHERE id = $1 and model_id = $2 and uid_id=$3  and  lock_id =$4` ;

       } ,
        getZoneForRideBooking:()=>
        {
            return `select zone_id from inventory.tbl_bike_allotment_zone_wise where vehicle_model_id= $1 and uid = $2 and status_enum_id = 1
            order by  id desc  limit 1`
        },


        getAreaAndAreaType:()=>
        {
            return `select zd.area_id ,
            a.map_city_id, a.area_type_enum_id
            from  
            masters.tbl_zone_detail zd
            inner join masters.tbl_area a on 
            a.id = zd.area_id
            where zd.id = $1`
        },

        getFarePlanDataForRideBookings:()=>
        {
            return `select * from masters.tbl_fare_plan where aplicable_date =(select max(aplicable_date) from masters.tbl_fare_plan
            where aplicable_date <=$1 and map_city_id = $2 and area_type_enum_id= $3 and model_id = $4 and area_id= $5  and status_enum_id=1 limit 1)`
        },      
    


    getRideBookingByUserIdAndLockNumber: () => {
        return `SELECT tblride.id, tblride.user_id,
        (select tbladmin.user_name from admin.tbl_admin tbladmin  where tbladmin.id = tblride.user_id) as user_name,
        (select tbladmin.min_wallet_amount from admin.tbl_admin tbladmin  where tbladmin.id = tblride.user_id) as min_wallet_amount,
        (select tbladmin.extra_charges from admin.tbl_admin tbladmin  where tbladmin.id = tblride.user_id) as extra_charges,
        tblride.vehicle_model_id, 
        (select tblvehmod.model_name  FROM masters.tbl_vehicle_model tblvehmod where tblvehmod.id= tblride.vehicle_model_id )as model_name,
        tblride.vehicle_uid_id,
        (select tblvehmod.model_uid FROM inventory.tbl_uid tblvehmod where tblvehmod.id = tblride.vehicle_uid_id) model_uid_number,
        tblride.vehicle_lock_id,
        (select tblvehmod.lock_number  FROM inventory.tbl_lock_detail tblvehmod where tblvehmod.id= tblride.vehicle_lock_id ) as lock_number,
        tblride.ride_booking_min,
        tblride.from_ride_time,
        tblride.to_ride_time,
        tblride.actual_ride_time, 
        tblride.actual_ride_min, 
        tblride.ride_payment_status, 
        tblride.hiring_charges, 
        tblride.pervious_charges, 
        tblride.createdon_date, 
        tblride.updatedon_date, 
        tblride.status_enum_id,
        tblride.payment_id,
        (select tbladmin.payment_id from admin.tbl_payment_transaction_details tbladmin  where tbladmin.id = tblride.payment_id) as payment,
        tblride.extra_ride_charges ,
        tblride.total_ride_amount,
        cast((coalesce(tblride.distance_in_meters,0)) as numeric)/1000 as distance_in_meters ,
        tblride.ride_start_latitude,
        tblride.ride_start_longitude, 
        tblride.ride_end_latitude,
        tblride.ride_end_longitude,
        tblride.bike_rideing_status,
        (select tblstatus.enum_key from tbl_enum tblstatus where tblstatus.enum_id = tblride.bike_rideing_status) as bike_rideing_status_name ,
        tblride.bike_id,
		tblride.fare_plan_id,
		--(select * from masters.tbl_fare_plan id =tblride.area_id ) as area_name,
		tblride.ride_start_address,
		tblride.ride_start_external_battery_voltage ,
		tblride.ride_start_internal_battery_voltage ,
		tblride.ride_start_zone_id,
        (select name from masters.tbl_zone_detail where id = tblride.ride_start_zone_id ) as ride_start_zone_name ,		
		tblride.beep_on_count,
		tblride.beep_off_count,
		tblride.area_id,
		(select name from masters.tbl_area where id =tblride.area_id ) as area_name,
		tblride.map_city_id	,
		(select map_city_name from masters.tbl_map_city where map_city_id =tblride.map_city_id ) as map_city_name,
        tblride.ride_booking_no,
		tblride.ride_start_ext_battery_percentage ,
        tblride.minimum_hiring_time ,
        tblride.minimum_rent_rate ,
        tblride.end_ride_user_id ,
        (select tbladmin.user_name from admin.tbl_admin tbladmin  where tbladmin.id = tblride.end_ride_user_id) as end_ride_user_name,
        tblride.ride_end_zone_id ,
        (select name from masters.tbl_zone_detail where id = tblride.ride_end_zone_id ) as ride_end_zone_name ,	
        tblride.ride_end_ext_battery_percentage	
        FROM admin.tbl_ride_booking tblride WHERE 
        (tblride.vehicle_lock_id = $1 or $1 = 0 )  AND 
        (tblride.status_enum_id = $2  or $2 = 0) AND 
        (tblride.user_id = $3  or $3 = 0)  
        and  tblride.bike_rideing_status in (15,16) 
        order by tblride.id desc
        limit 10
    
        ;`;
    },
    updateUnlockFlag: () => {
        return `update inventory.tbl_lock_detail set ride_start_unlock_flag_enum_id =$1 , ridestartunlockflaglastupdatetime =$2
                 where id = $3`;
    },
    updatePoweronFlag: () => {
        return `update inventory.tbl_lock_detail set ride_start_poweron_flag_enum_id =$1 , ridestartpoweronflaglastupdatetime =$2
                 where id = $3`;
    },

    getLockDetailForScheduleRideStartQuery:()=>{
        return `select ride_start_unlock_flag_enum_id ,ride_start_poweron_flag_enum_id ,lock_number ,id 
        from inventory.tbl_lock_detail where ride_start_unlock_flag_enum_id in (98,103) OR ride_start_poweron_flag_enum_id in (100,102)`
    } ,
    },
    userTransaction: {
        insertUserTransactionDetails: () => {
            return `INSERT INTO admin.tbl_user_transaction(
                 user_id, payment_id, transaction_type_enum_id, wallet_amount, extra_charges, hiring_charges, withdrawn_id,createdon_date,ride_booking_id,current_wallet_amount,remark,amount_added_by_user_id,deposit_amount,recharge_amount,transaction_from_enum_id)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10,$11,$12,$13,$14,$15) RETURNING id;`;
        },

        paymentSettulled: () => {
            return `update admin.tbl_payment_transaction_details set online_payment_status_enum_id = 32 , payment_order_no =$2 where id=$1`;
        },

        paymentFromSchedulerSettulled: () => {
            return `update admin.tbl_payment_transaction_details set online_payment_status_enum_id = 32  where id=$1`;
        },
        getAllTransaction: () => {
            return `SELECT tbltran.id,
            tbltran.user_id,
            (select tblstatus.user_name from admin.tbl_admin tblstatus where tblstatus.id = tbltran.user_id) as user_name,
            (select tblstatus.mobile from admin.tbl_admin tblstatus where tblstatus.id = tbltran.user_id) as contact,
            tbltran.payment_id,          
            tbltran.transaction_type_enum_id,
            (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tbltran.transaction_type_enum_id ) transaction_type,
            tbltran.wallet_amount,
            tbltran.extra_charges,
            tbltran.hiring_charges,          

            (select tblride.from_ride_time from admin.tbl_ride_booking tblride where tblride.id = tbltran.ride_booking_id) as   from_ride_time,
            (select tblride.actual_ride_time from admin.tbl_ride_booking tblride where tblride.id = tbltran.ride_booking_id) as  to_ride_time,
            (select tblride.actual_ride_min from admin.tbl_ride_booking tblride where tblride.id = tbltran.ride_booking_id) as   ride_min,
            tbltran.createdon_date,
            tbltran.updatedon_date,
            tbltran.withdrawn_id,
            tbltran.ride_booking_id,

            tblride.ride_start_latitude ,
            tblride.ride_start_longitude ,
            tblride.ride_end_latitude,
            tblride.ride_end_longitude ,
            tblride.ride_rating,
            tblride.ride_comments,
            tblride.ride_Comments_reply ,
            tblride.comments_reply_status_enum_id,
            tblride.ride_start_zone_id ,
            ( select name  from masters.tbl_zone_detail where id = tblride.ride_start_zone_id) as ride_start_zone_name ,       
            tblride.ride_end_zone_id ,
            ( select name  from masters.tbl_zone_detail where id = tblride.ride_end_zone_id) as end_start_zone_name ,
    
           -- (select tblride.ride_start_latitude from admin.tbl_ride_booking tblride where tblride.id = tbltran.ride_booking_id) as ride_start_latitude,
           -- (select tblride.ride_start_longitude from admin.tbl_ride_booking tblride where tblride.id = tbltran.ride_booking_id) as ride_start_longitude,
           -- (select tblride.ride_end_latitude from admin.tbl_ride_booking tblride where tblride.id = tbltran.ride_booking_id) as ride_end_latitude,
           -- (select tblride.ride_end_longitude from admin.tbl_ride_booking tblride where tblride.id = tbltran.ride_booking_id) as ride_end_longitude,
           -- (select tblride.ride_rating from admin.tbl_ride_booking tblride where tblride.id = tbltran.ride_booking_id) as ride_rating,
           -- (select tblride.ride_comments from admin.tbl_ride_booking tblride where tblride.id = tbltran.ride_booking_id) as ride_comments,
           -- (select tblride.ride_Comments_reply from admin.tbl_ride_booking tblride where tblride.id = tbltran.ride_booking_id) as ride_Comments_reply,
           -- (select tblride.comments_reply_status_enum_id from admin.tbl_ride_booking tblride where tblride.id = tbltran.ride_booking_id) as comments_reply_status_enum_id,	

            (select tblstatus.enum_key from public.tbl_enum tblstatus where tblstatus.enum_id = tblride.comments_reply_status_enum_id) as comments_reply_status,

			 wtd.withdraw_request_status_enum_id,

            (select tblstatus.enum_key from public.tbl_enum tblstatus where tblstatus.enum_id = wtd.withdraw_request_status_enum_id) as withdraw_request_status ,							
			COALESCE(( select td.payment_order_no from admin.tbl_payment_transaction_details  td where td.id =tbltran.payment_id),
			(select wd.withdraw_no from admin.tbl_withdraw_transaction_details wd where wd.id = tbltran.withdrawn_id) ,
			(select rb.ride_booking_no from admin.tbl_ride_booking rb where rb.id =tbltran.ride_booking_id ),'') as order_no ,
            tbltran.amount_added_by_user_id ,
            (select add.user_name from admin.tbl_admin add where add.id = tbltran.amount_added_by_user_id) as amount_added_by_user_name ,
          (select tblstatus.enum_key from public.tbl_enum tblstatus where tblstatus.enum_id =  (select add.user_type_enum_id from admin.tbl_admin add where add.id = tbltran.amount_added_by_user_id)) as amount_added_by_user_type ,
		  tbltran.remark ,

            wtd.createdon_date as createdon_date_w,
            wtd.updatedon_date as updatedon_date_w ,
            wtd.cancelled_date  ,
            wtd.cancelled_user_id ,
            (select tblstatus.user_name from admin.tbl_admin tblstatus where tblstatus.id = wtd.cancelled_user_id) as cancelled_user_name ,
            wtd.cancelled_remark,
            wtd.id as request_id

            FROM admin.tbl_user_transaction tbltran 
            inner join admin.tbl_admin ad on 
            tbltran.user_id = ad.id 
			left join admin.tbl_withdraw_transaction_details wtd on 
			wtd.id = tbltran.withdrawn_id 
            left join admin.tbl_ride_booking tblride on
             tblride.id = tbltran.ride_booking_id			

            WHERE (tbltran.user_id=$1 or $1=0) 
                 and (UPPER(TRIM(ad.user_name)) LIKE '%' || UPPER(TRIM($2)) ||'%'  OR $2 ='')
                 and (ad.mobile LIKE '%' || $3 ||'%'  OR  $3='')
                 and ( tbltran.transaction_type_enum_id =$4 OR $4 =0 )
            order by tbltran.createdon_date desc;`;
        },

        getLastTenTransaction: () => {
            return `SELECT tbltran.id,
            tbltran.user_id,
            (select tblstatus.user_name from admin.tbl_admin tblstatus where tblstatus.id = tbltran.user_id) as user_name,
            (select tblstatus.mobile from admin.tbl_admin tblstatus where tblstatus.id = tbltran.user_id) as contact,
            tbltran.payment_id,          
            tbltran.transaction_type_enum_id,
            (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =tbltran.transaction_type_enum_id ) transaction_type,
            tbltran.wallet_amount,
            tbltran.extra_charges,
            tbltran.hiring_charges,          

            (select tblride.from_ride_time from admin.tbl_ride_booking tblride where tblride.id = tbltran.ride_booking_id) as   from_ride_time,
            (select tblride.actual_ride_time from admin.tbl_ride_booking tblride where tblride.id = tbltran.ride_booking_id) as  to_ride_time,
            (select tblride.actual_ride_min from admin.tbl_ride_booking tblride where tblride.id = tbltran.ride_booking_id) as   ride_min,
            tbltran.createdon_date,
            tbltran.updatedon_date,
            tbltran.withdrawn_id,
            tbltran.ride_booking_id,
            (select tblride.ride_start_latitude from admin.tbl_ride_booking tblride where tblride.id = tbltran.ride_booking_id) as ride_start_latitude,
            (select tblride.ride_start_longitude from admin.tbl_ride_booking tblride where tblride.id = tbltran.ride_booking_id) as ride_start_longitude,
            (select tblride.ride_end_latitude from admin.tbl_ride_booking tblride where tblride.id = tbltran.ride_booking_id) as ride_end_latitude,
            (select tblride.ride_end_longitude from admin.tbl_ride_booking tblride where tblride.id = tbltran.ride_booking_id) as ride_end_longitude,
			 wtd.withdraw_request_status_enum_id,
            (select tblstatus.enum_key from public.tbl_enum tblstatus where tblstatus.enum_id = wtd.withdraw_request_status_enum_id) as withdraw_request_status ,
			
						
			  COALESCE(( select td.payment_order_no from admin.tbl_payment_transaction_details  td where td.id =tbltran.payment_id),
					(select wd.withdraw_no from admin.tbl_withdraw_transaction_details wd where wd.id = tbltran.withdrawn_id) ,
					(select rb.ride_booking_no from admin.tbl_ride_booking rb where rb.id =tbltran.ride_booking_id ),'') as order_no
  
            FROM admin.tbl_user_transaction tbltran 
			left join admin.tbl_withdraw_transaction_details wtd on 
			wtd.id = tbltran.withdrawn_id 
            WHERE (tbltran.user_id=$1 or $1=0)
            order by tbltran.id  desc limit 10;`;
        }, 

        getTransactionExitOrNot: () => {
            return `select  online_payment_status_enum_id  from admin.tbl_payment_transaction_details where id =$1`        
           },
           getUserTransaction: () => {
            return ` select id  from  admin.tbl_user_transaction where payment_id =$1 ` 
        } ,
        getUserPaymentOnlineTransaction: () => {
            return ` select  
 put.user_id,
 ad.user_name ,
 ad.mobile ,
 put.amount,
 put.currency,
 put.status,
 put.order_id,
 put.wallet,
 put.email,
 put.created_at,
 put.createdon_date,
 put.updatedon_date,
 put.online_payment_status_enum_id,
(select tblstatus.enum_key from public.tbl_enum tblstatus where tblstatus.enum_id = put.online_payment_status_enum_id) as online_payment_status 	
 from admin.tbl_payment_transaction_details  put
 inner join admin.tbl_admin ad on 
 ad.id =  put.user_id
 where user_id =$1 ` 
        } ,
        
    },

    deviceInformationLog: {
        addInstructionLog: () => {
            return `INSERT INTO admin.tbl_add_device_instruction_log(
            lock_id, device_id, device_lock_and_unlock_status,device_lock_and_unlock_status_name, instruction_id,instruction_name ,status_enum_id, action_remarks, 
            createdon_date, createdby_login_user_id, createdby_user_type_enum_id,ride_booking_id,device_lock_unlock_communication_enum_id,remarks)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9,$10,$11,$12,$13,$14) RETURNING id;`;
        },

        addInstructionPowerOnOffLogQ: () => {
            return `INSERT INTO admin.tbl_add_power_onoff_instruction(
            lock_id,power_on_off_status_enum_id,  power_onoff_instruction_enum_id,status_enum_id, action_remarks, 
            createdon_date, createdby_login_user_id, ride_booking_id ,remarks)
            VALUES ($1, $2, $3, $4, $5, $6, $7,$8,$9) RETURNING id;`;
        },
        addDeviceRegistrationLog: () => {
            return `INSERT INTO admin.tbl_add_device_information_log(
                 lock_id,device_id,status_enum_id,action_remarks,createdon_date, createdby_login_user_id,createdby_user_type_enum_id,name,registration_number,registartion_status,imei_number, serial_number,odometer, run_time,chassis_number,date_of_manufacture,date_of_service)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,$13,$14,$15,$16,$17);`;
        },
        addDeviceInformationLog: () => {
            return `INSERT INTO admin.tbl_add_device_information_log(
                 lock_id, device_id, status_enum_id,action_remarks, createdon_date, createdby_login_user_id, createdby_user_type_enum_id,  location, latitude, longitude, altitude, speed, battery, internal_batt_v, external_batt_v,previous_latitude,previous_longitude,distance_in_meters,ride_booking_id)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,$13,$14,$15,$16,$17,$18,$19);`;
        }

    },
    areaMasters:
    {
        insertAreaDetail:  ()=>
        {
            return `INSERT INTO  masters.tbl_area(name,area_type_enum_id,status_enum_id,createdon_date,created_by_id,map_city_id,place_id , Pin_code,full_address,map_draw_object_enum_id ,map_draw_object ,map_draw_object_address,
                area_api_circle_center ,
                area_api_circle_redius,
                area_api_south_west_point,

                area_api_north_east_point,
                area_api_polygon,
                area_api_db_polygon
                ) 
                        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) returning id;`;

        },

        getAreaDetails:()=>
        {
      return `     
select 
ta.id,
ta.name,
(select s.map_state_id from masters.tbl_map_state s where  s.map_state_id =cities.map_state_id) map_state_id,
(select s.map_state_name from masters.tbl_map_state s where  s.map_state_id =cities.map_state_id) map_state_name,
cities.map_city_name ,
ta.map_city_id,
ta.area_type_enum_id,
(select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =ta.area_type_enum_id )  area_type ,
ta.status_enum_id,
(select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =ta.status_enum_id )  area_status ,
ta.createdon_date,
ta.created_by_id ,
ta.place_id ,
ta.Pin_code,
ta.full_address,
ta.map_draw_object_enum_id ,
(select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =ta.map_draw_object_enum_id )  map_draw_object_status ,
ta.map_draw_object ,
ta.map_draw_object_address ,
ta.area_api_circle_center ,
ta.area_api_circle_redius,
ta.area_api_south_west_point,
ta.area_api_north_east_point,
ta.area_api_polygon,
ta.area_api_db_polygon ,
ta.updatedon_date

from  masters.tbl_area ta 

inner join masters.tbl_map_city
cities on  cities.map_city_id =ta.map_city_id
      where ( ta.id = $1 OR $1 =0)  and (ta.map_city_id = $2 OR $2 =0) 
      order by cities.map_city_name ,ta.name asc ;`;
        },

        getCityAreaForBeepOnOff:()=>
        {
      return `     select   a.id as area_id,
        a.map_city_id,
        a.area_type_enum_id ,
        lockDetail.id as lock_id,
        a.map_draw_object_enum_id as area_map_draw_object_enum_id ,                   
        a.area_api_circle_center ,
        a.area_api_circle_redius,
        a.area_api_south_west_point,
        a.area_api_north_east_point,
        a.area_api_polygon,
        a.area_api_db_polygon,
       mapc.map_draw_object_enum_id as city_map_draw_object_enum_id,          
       mapc.city_api_circle_center ,
       mapc.city_api_circle_redius,
       mapc.city_api_south_west_point,
       mapc.city_api_north_east_point,
       mapc.city_api_polygon,
       mapc.city_api_db_polygon,
       lockDetail.latitude,
       lockDetail.longitude,
       lockDetail.beep_status_enum_id  ,
       lockDetail.beep_instruction_enum_id  
   from  inventory.tbl_lock_detail lockDetail
   
   inner join inventory.tbl_product_bike pb on 
   lockDetail.id = pb.lock_id
   inner join masters.tbl_zone_detail zd on
   zd.id = pb.zone_id
  inner join masters.tbl_area a on 
   a.id = zd.area_id
  inner join masters.tbl_map_city mapc on 
   mapc.map_city_id = a.map_city_id
   where lockDetail.id = $1`;
},
        


        getMapAreaDetailsForSearche:()=>
        {
      return `select 
      ta.id,
      ta.name,
      --(select s.map_state_id from masters.tbl_map_state s where  s.map_state_id =cities.map_state_id) map_state_id,
      --(select s.map_state_name from masters.tbl_map_state s where  s.map_state_id =cities.map_state_id) map_state_name,
      countrys.map_country_id,
      countrys.map_country_name ,
      states.map_state_id,
      states.map_state_name,
      cities.map_city_name ,
      ta.map_city_id,
      ta.area_type_enum_id,
      (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =ta.area_type_enum_id )  area_type ,
      ta.status_enum_id,
      (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =ta.status_enum_id )  area_status ,
      ta.createdon_date,
      ta.created_by_id ,
      ta.place_id ,
      ta.Pin_code,
      ta.full_address,
      ta.map_draw_object_enum_id ,
      (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =ta.map_draw_object_enum_id )  map_draw_object_status ,
      ta.map_draw_object ,
      ta.map_draw_object_address ,
      ta.area_api_circle_center ,
      ta.area_api_circle_redius,
      ta.area_api_south_west_point,
      ta.area_api_north_east_point,
      ta.area_api_polygon,
      ta.area_api_db_polygon
      from   masters.tbl_area ta
	  inner join masters.tbl_map_city cities on   
      cities.map_city_id=ta.map_city_id 
	  inner join masters.tbl_map_state states on
      states.map_state_id =cities.map_state_id
	  inner join masters.tbl_map_country countrys on
	  countrys.map_country_id =states.map_country_id 
	  where  
      UPPER(TRIM(countrys.map_country_name)) = UPPER(TRIM($1)) and 
	  ( UPPER(TRIM(states.map_state_name)) =  UPPER(TRIM($2)) OR $2 ='' ) and
	  ( UPPER(TRIM(cities.map_city_name)) = UPPER(TRIM($3)) OR $3='' OR   UPPER(TRIM(cities.user_city_name)) = UPPER(TRIM($3))) and 
	  (ta.id = $4 Or $4=0) order by countrys.map_country_name ,states.map_state_name,cities.map_city_name ,ta.name asc; `;
        },



        getMapAreaDetails:()=>
        {
      return ` 	   
      select 
      ta.id,
      ta.name,
     (select s.map_state_id from masters.tbl_map_state s where  s.map_state_id =cities.map_state_id) map_state_id,
(select s.map_state_name from masters.tbl_map_state s where  s.map_state_id =cities.map_state_id) map_state_name,
cities.map_city_name ,
ta.map_city_id,
ta.area_type_enum_id,
(select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =ta.area_type_enum_id )  area_type ,
ta.status_enum_id,
(select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =ta.status_enum_id )  area_status ,
ta.createdon_date,
ta.created_by_id
from  masters.tbl_area ta 
inner join masters.tbl_map_city
cities on  cities.map_city_id =ta.map_city_id
      where ( ta.id = $1 OR $1 =0)  and (ta.map_city_id = $2 OR $2 =0)
      and (ta.area_type_enum_id = $3 OR $3 =0);`;
        },

        getMapAreaDetailsReport:()=>
        {
      return ` 	   
      select 
      ta.id,
      ta.name,
     (select s.map_state_id from masters.tbl_map_state s where  s.map_state_id =cities.map_state_id) map_state_id,
(select s.map_state_name from masters.tbl_map_state s where  s.map_state_id =cities.map_state_id) map_state_name,
cities.map_city_name ,
ta.map_city_id,
ta.area_type_enum_id,
(select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =ta.area_type_enum_id )  area_type ,
ta.status_enum_id,
(select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =ta.status_enum_id )  area_status ,
ta.createdon_date,
ta.created_by_id
from  masters.tbl_area ta 
inner join masters.tbl_map_city
cities on  cities.map_city_id =ta.map_city_id
      where ( ta.id = $1 OR $1 =0)  and (ta.map_city_id = any($2) OR $2 ='{0}')
      and (ta.area_type_enum_id = any($3) OR $3 ='{0}');`;
        },

        getZoneDetailForReport: () => {
            return `                
            SELECT tblzone.id, tblzone.name, tblzone.latitude, tblzone.longitude, tblzone.zone_size, tblzone.zone_capacity, tblzone.zone_address,                                 
            -- (select tblstatus.state_name from masters.tbl_state tblstatus where tblstatus.state_id = tblzone.state_id) as state_name,
             ta.map_city_id as city_id,
             tblzone.area_id,
             ta.name as area_name ,
             (select tblstatus.map_city_name from masters.tbl_map_city tblstatus where tblstatus.map_city_id = ta.map_city_id) as city_name,
             tblzone.status_enum_id,
             
             (select s.map_state_id from masters.tbl_map_state s where  s.map_state_id =cities.map_state_id) state_id,
             (select s.map_state_name from masters.tbl_map_state s where  s.map_state_id =cities.map_state_id) state_name,
             (select tblstatus.enum_key from tbl_enum tblstatus where tblstatus.enum_id = tblzone.status_enum_id) as status_name,
             tblzone.remarks, 
             tblzone.action_remarks, 
             tblzone.createdon_date, 
             tblzone.createdby_login_user_id, 
             (select tblstatus.user_name from admin.tbl_admin tblstatus where tblstatus.id = tblzone.createdby_login_user_id) as created_by_user_name,
             tblzone.createdby_user_type_enum_id, 
             (select tblstatus.enum_key from tbl_enum tblstatus where tblstatus.enum_id = tblzone.createdby_user_type_enum_id) as created_by_user_type_name,
             tblzone.updated_login_user_id, 
             (select tblstatus.user_name from admin.tbl_admin tblstatus where tblstatus.id = tblzone.updated_login_user_id) as updated_login_user_name,
             tblzone.updatedon_date,
             tblzone.updatedby_user_type_enum_id,
             (select tblstatus.enum_key from tbl_enum tblstatus where tblstatus.enum_id = tblzone.updatedby_user_type_enum_id) as updated_by_user_type_name,
             ta.area_type_enum_id,
        (select tblstatus.enum_key from tbl_enum tblstatus where tblstatus.enum_id = ta.area_type_enum_id) as area_enum_type_name

             FROM masters.tbl_zone_detail tblzone                                 
              inner join masters.tbl_area ta  on
              tblzone.area_id = ta.id
             inner join masters.tbl_map_city
             cities on  cities.map_city_id =ta.map_city_id                 
             WHERE  (tblzone.id = $1 OR $1 = 0) AND
             (tblzone.area_id = any($2) OR $2 = ('{0}'));`;
        },


    //     getAreaCityState:()=>
    //     {
    //         return `select  distinct on(ta.city_id)    
    //         (select s.state_id from masters.tbl_state s where  s.state_id =cities.state_id) state_id,
    //    (select s.state_name from masters.tbl_state s where  s.state_id =cities.state_id) state_name,
    //    cities.city_name ,
    //    ta.city_id
    //    from  masters.tbl_fare_plan ta 
    //    inner join masters.tbl_cities
    //    cities on  cities.city_id =ta.city_id order by ta.city_id desc `
    //     },

        getAreaMapCityState:()=>
        {
            return `select  distinct on(ta.map_city_id)    
            (select s.map_state_id from masters.tbl_map_state s where  s.map_state_id =cities.map_state_id) state_id,
       (select s.map_state_name from masters.tbl_map_state s where  s.map_state_id =cities.map_state_id) state_name,
       cities.map_city_name ,
       ta.map_city_id ,
       ar.area_type_enum_id,
       (select tblstatus.enum_key from tbl_enum tblstatus where tblstatus.enum_id = ar.area_type_enum_id) as area_enum_type_name,
       ta.createdon_date,ta.updatedon_date

       from  masters.tbl_fare_plan ta 
       inner join masters.tbl_map_city 
       cities on  cities.map_city_id =ta.map_city_id 
       inner join masters.tbl_area ar on
       ar.id = ta.area_id       
       order by ta.map_city_id desc `
        },

        
        updateAreaDetail:  ()=>
        {
             
            return `update masters.tbl_area set name = $2, 			  
			  
			   area_type_enum_id = $3,
			   status_enum_id = $4,
			   updatedon_date = $5,
			   updated_by_id = $6,
               map_city_id = $7,
               place_id = $8,
                 Pin_code = $9,
                 full_address= $10,
                 map_draw_object_enum_id = $11 ,
                 map_draw_object = $12 ,
                 map_draw_object_address = $13,

                area_api_circle_center  = $14,
                area_api_circle_redius  = $15,
                area_api_south_west_point  = $16,

                area_api_north_east_point = $17,
                area_api_polygon = $18,
                area_api_db_polygon = $19
			   where id = $1;`;

        },


        getStatesForArea: () => {
            return `select state_id from masters.tbl_state where state_id = $1`;
        },
        getCities: () => {
            return `select state_id from masters.tbl_cities where city_id = $1`;
        },

        getMapStatesForArea: () => {
            return `select map_state_id from masters.tbl_map_state where map_state_id = $1`;
        },
        getMapCities: () => {
            return `select map_state_id from masters.tbl_map_city where map_city_id = $1`;
        },       

        getzoneDetailWithBikeCountList: () => {
            return ` select 
            zd.id,
            zd.name,
            (select count(id) from inventory.tbl_product_bike where zone_id = zd.id and  bike_booked_status=14) bike_count,
           zd.latitude,
           zd.longitude,
            zd.zone_size,
            zd.zone_capacity,
            zd.zone_address,
            ta.name as area_name ,
            countrys.map_country_id,
            countrys.map_country_name ,
            states.map_state_id,
            states.map_state_name,
            cities.map_city_name ,
            cities.map_city_id,
            ta.area_type_enum_id,
            (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =ta.area_type_enum_id )  area_type ,
            zd.status_enum_id,
            (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =zd.status_enum_id )  area_status ,
            zd.createdon_date   ,
            ta.place_id ,
            ta.Pin_code,
            ta.full_address,
            ta.map_draw_object_enum_id ,
            (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =ta.map_draw_object_enum_id )  map_draw_object_status ,
            ta.map_draw_object ,
            ta.map_draw_object_address
            from  masters.tbl_zone_detail zd
			inner join  masters.tbl_area ta  on
            ta.id  = zd.area_id
            inner join masters.tbl_map_city        
            cities on   cities.map_city_id=ta.map_city_id -- and (cities.map_city_id =$1OR $1=0) 
            inner join masters.tbl_map_state states on
            states.map_state_id =cities.map_state_id 
            inner join masters.tbl_map_country countrys on
            states.map_country_id   = countrys.map_country_id  
            where ( UPPER(TRIM(countrys.map_country_name)) = UPPER(TRIM($1)) OR $1='' ) and 
			( UPPER(TRIM(states.map_state_name)) = UPPER(TRIM($2)) Or $2 ='')
			and ( UPPER(TRIM(cities.map_city_name)) = UPPER(TRIM($3)) Or $3 ='' OR  UPPER(TRIM(cities.user_city_name)) = UPPER(TRIM($3)) )`;
        },  

        getzoneDetailWithBikeCountList1: () => {
            return `select 
            zd.id,
            zd.name,
            (select count(id) from inventory.tbl_product_bike where zone_id = zd.id and  bike_booked_status=14) bike_count,
           zd.latitude,
           zd.longitude,
            zd.zone_size,
            zd.zone_capacity,
            zd.zone_address,
            ta.name as area_name ,
            countrys.map_country_id,
            countrys.map_country_name ,
            states.map_state_id,
            states.map_state_name,
            cities.map_city_name ,
            cities.map_city_id,
            ta.area_type_enum_id,
            (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =ta.area_type_enum_id )  area_type ,
            zd.status_enum_id,
            (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =zd.status_enum_id )  area_status ,
            zd.createdon_date   ,
            ta.place_id ,
            ta.Pin_code,
            ta.full_address,
            ta.map_draw_object_enum_id ,
            (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =ta.map_draw_object_enum_id )  map_draw_object_status ,
            ta.map_draw_object ,
            ta.map_draw_object_address
            from  masters.tbl_zone_detail zd
			inner join  masters.tbl_area ta  on
            ta.id  = zd.area_id
            inner join masters.tbl_map_city        
            cities on   cities.map_city_id=ta.map_city_id and (cities.map_city_id =$2 OR $2=0) 
            inner join masters.tbl_map_state states on
            states.map_state_id =cities.map_state_id 
            inner join masters.tbl_map_country countrys on
            states.map_country_id   = countrys.map_country_id        
            where  (zd.id = $1 Or $1=0)
            `;
        }, 
        
        getzoneDetailWithBikeAllTypeCountList: () => {
            return ` 
            select 
                        zd.id,
                        zd.name,  
                        (select count(id) from inventory.tbl_product_bike where zone_id = zd.id) total_bike_count ,
                        (select count(id) from inventory.tbl_product_bike where zone_id = zd.id and  bike_booked_status=14) available_bike_count,
                        (select count(id) from inventory.tbl_product_bike where zone_id = zd.id and  bike_booked_status=13) booked_bike_count,
                        (select count(id) from inventory.tbl_product_bike where zone_id = zd.id and  bike_booked_status=35) undermaintenance_bike_count,
                       zd.latitude,
                       zd.longitude,
                        zd.zone_size,
                        zd.zone_capacity,
                        zd.zone_address,
                        ta.name as area_name ,
                        countrys.map_country_id,
                        countrys.map_country_name ,
                        states.map_state_id,
                        states.map_state_name,
                        cities.map_city_name ,
                        cities.map_city_id,
                        ta.area_type_enum_id,
                        (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =ta.area_type_enum_id )  area_type ,
                        zd.status_enum_id,
                        (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =zd.status_enum_id )  area_status ,
                        zd.createdon_date   ,
                        ta.place_id ,
                        ta.Pin_code,
                        ta.full_address,
                        ta.map_draw_object_enum_id ,
                        (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =ta.map_draw_object_enum_id )  map_draw_object_status ,
                        ta.map_draw_object ,
                        ta.map_draw_object_address
                        from  masters.tbl_zone_detail zd
                        inner join  masters.tbl_area ta  on
                        ta.id  = zd.area_id
                        inner join masters.tbl_map_city        
                        cities on   cities.map_city_id=ta.map_city_id -- and (cities.map_city_id =$1OR $1=0) 
                        inner join masters.tbl_map_state states on
                        states.map_state_id =cities.map_state_id 
                        inner join masters.tbl_map_country countrys on
                        states.map_country_id   = countrys.map_country_id   
            where ( UPPER(TRIM(countrys.map_country_name)) = UPPER(TRIM($1)) OR $1='' ) and 
			( UPPER(TRIM(states.map_state_name)) = UPPER(TRIM($2)) Or $2 ='')
			and ( UPPER(TRIM(cities.map_city_name)) = UPPER(TRIM($3)) Or $3 ='' OR  UPPER(TRIM(cities.user_city_name)) = UPPER(TRIM($3)) )
            and  (zd.id = $4 Or $4 = 0)
      `;
        }, 
        getAreaDetailWithBikeCountList: () => {
            return `    select 
        ta.id,  
        ta.name ,
        count(pb.id) bike_count	             
          from  masters.tbl_map_country countrys
inner join masters.tbl_map_state states on
states.map_country_id =countrys.map_country_id 
inner join masters.tbl_map_city
cities on   cities.map_state_id=states.map_state_id -- and (cities.map_city_name ='bherunda')
inner join  masters.tbl_area ta  on
ta.map_city_id = cities.map_city_id --and (ta.id = $4 Or $4=0)
left join masters.tbl_zone_detail zd  on
zd.area_id = ta.id
left join inventory.tbl_product_bike pb on
pb.zone_id = zd.id and bike_booked_status=14

where   UPPER(TRIM(countrys.map_country_name)) =  UPPER(TRIM($1))
and ( UPPER(TRIM(states.map_state_name)) =  UPPER(TRIM($2)) OR $2 ='') 
and ( UPPER(TRIM(cities.map_city_name)) = UPPER(TRIM($3)) OR $3 =''  OR  UPPER(TRIM(cities.user_city_name)) = UPPER(TRIM($3)))
group by ta.id
order by ta.id desc
`;
},  
        checkMapAreaNameExists: () => 
        {
            return `SELECT id FROM masters.tbl_area where UPPER(TRIM(name))= UPPER(TRIM($2)) and map_city_id = $3 and id <> $1 limit 1`
        },

        getVehicleTypeList: () => {
            return `select id, name  from masters.tbl_vehicle_type where status_enum_id = 1`;
        },  
        

        insertMapCountryQuery:  ()=>
        {
            return `INSERT INTO  masters.tbl_map_country(map_country_name,status_enum_id,createdon_date ,createdby_login_user_id ) 
                        VALUES ($1,$2,$3,$4) returning map_country_id;`;

        },
        checkMapCountryNameExistsQuery: () => 
        {
            return `SELECT map_country_id FROM masters.tbl_map_country where UPPER(TRIM(map_country_name))= UPPER(TRIM($1)) and map_country_id  <> $2 limit 1`
        },

        insertMapStateQuery:  ()=>
        {
            return `INSERT INTO  masters.tbl_map_state(map_state_name,map_country_id,status_enum_id,createdon_date ,createdby_login_user_id ) 
                        VALUES ($1,$2,$3,$4,$5) returning map_state_id;`;
        },

        checkMapStateNameExistsQuery: () => 
        {
            return `SELECT map_state_id FROM masters.tbl_map_state where UPPER(TRIM(map_state_name))= UPPER(TRIM($1))  and map_country_id =$2 limit 1`
        },

        insertMapCityQuery:  ()=>
        {
            return `INSERT INTO  masters.tbl_map_city (
                map_city_name,
                map_state_id,
                status_enum_id,
                createdon_date ,
                createdby_login_user_id,
                user_city_name ,
                pin_code,
                full_address,
                place_id,
                map_draw_object_enum_id ,
                map_draw_object ,
                map_draw_object_address,

                city_api_circle_center ,
                city_api_circle_redius,
                city_api_south_west_point,

                city_api_north_east_point,
                city_api_polygon,
                city_api_db_polygon
                 ) 
                        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) returning map_city_id;`;

        },

        updateMapCityQuery:  ()=>
        {
            return `update masters.tbl_map_city  set 
                map_city_name =$2,
                map_state_id =$3,
                status_enum_id =$4,
                createdon_date =$5,
                createdby_login_user_id =$6,
                user_city_name =$7,
                pin_code =$8,
                full_address =$9,
                place_id =$10 ,
                map_draw_object_enum_id =$11 ,
                map_draw_object =$12,
                map_draw_object_address =$13,
                city_api_circle_center  = $14,
                city_api_circle_redius = $15,
                city_api_south_west_point = $16,

                city_api_north_east_point = $17,
                city_api_polygon = $18,
                city_api_db_polygon = $19
                where map_city_id = $1`;

        },


        checkMapCityNameExistsQuery: () => 
        {
            return `SELECT map_city_id FROM masters.tbl_map_city where UPPER(TRIM(map_city_name))= UPPER(TRIM($1))  and map_state_id = $2 and map_city_id <> $3 limit 1`
        },

        checkMapCityNameForSearchExistsQuery: () => 
        {
            return `SELECT map_city_id FROM masters.tbl_map_city where (UPPER(TRIM(map_city_name))= UPPER(TRIM($1)) OR UPPER(TRIM($1))='' )   and (map_state_id = $2) limit 1`
        },
        
        checkUserCityNameExistsQuery: () => 
        {
            return `SELECT map_city_id FROM masters.tbl_map_city where UPPER(TRIM(user_city_name))= UPPER(TRIM($1))  and map_state_id = $2 and map_city_id <> $3 limit 1`
        },

        getCityDataForTableQuery: () => 
        {
       return `select           
       states.map_state_id,
       states.map_state_name,
       cities.map_city_name ,
       cities.user_city_name,
       cities.map_city_id ,
       cities.createdon_date,cities.updatedon_date ,
       cities.status_enum_id ,
       (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =cities.status_enum_id) city_status
       from masters.tbl_map_city  cities                
       inner join masters.tbl_map_state states on
       states.map_state_id =cities.map_state_id 
       order by states.map_state_name ,cities.map_city_name ,
       cities.user_city_name asc `
       },

       getMapCityDetailQuery: () => 
       {
      return `select  
      countrys.map_country_id,
      countrys.map_country_name,
      states.map_state_id,
      states.map_state_name,
      cities.map_city_name ,
      cities.user_city_name ,
      cities.map_city_id, 
      cities.map_draw_object_enum_id ,
     (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =cities.map_draw_object_enum_id )  map_draw_object_status ,
      cities.createdon_date   ,
      cities.place_id ,
      cities.Pin_code,
      cities.full_address,
      cities.map_draw_object ,
      cities.map_draw_object_address,			
      cities.city_api_circle_center ,
      cities.city_api_circle_redius,
      cities.city_api_south_west_point,
      cities.city_api_north_east_point,
      cities.city_api_polygon,
      cities.city_api_db_polygon,
      cities.status_enum_id ,
     (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =cities.status_enum_id) city_status

      from masters.tbl_map_city  cities                
      inner join masters.tbl_map_state states on
      states.map_state_id =cities.map_state_id 
     inner join masters.tbl_map_country countrys on
      states.map_country_id   = countrys.map_country_id  
     where  (cities.map_city_id =$1 OR $1=0) `
      },

      getMapCityDetailReportQuery: () => 
      {
     return `select  
     countrys.map_country_id,
     countrys.map_country_name,
     states.map_state_id,
     states.map_state_name,
     cities.map_city_name ,
     cities.user_city_name ,
     cities.map_city_id, 
     cities.map_draw_object_enum_id ,
    (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =cities.map_draw_object_enum_id )  map_draw_object_status ,
     cities.createdon_date   ,
     cities.place_id ,
     cities.Pin_code,
     cities.full_address,
     cities.map_draw_object ,
     cities.map_draw_object_address,			
     cities.city_api_circle_center ,
     cities.city_api_circle_redius,
     cities.city_api_south_west_point,
     cities.city_api_north_east_point,
     cities.city_api_polygon,
     cities.city_api_db_polygon,
     cities.status_enum_id ,
    (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =cities.status_enum_id) city_status

     from masters.tbl_map_city  cities                
     inner join masters.tbl_map_state states on
     states.map_state_id =cities.map_state_id 
    inner join masters.tbl_map_country countrys on
     states.map_country_id   = countrys.map_country_id  
    where  ( cities.map_state_id =any($1) OR $1=('{0}') ) `
     },

      getMapCityDetailsForSearcheQ:()=>
      {
    return `select  
    countrys.map_country_id,
    countrys.map_country_name,
    states.map_state_id,
    states.map_state_name,
    cities.map_city_name ,
    cities.user_city_name ,
    cities.map_city_id, 
    cities.map_draw_object_enum_id ,
   (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =cities.map_draw_object_enum_id )  map_draw_object_status ,
    cities.createdon_date   ,
    cities.place_id ,
    cities.Pin_code,
    cities.full_address,
    cities.map_draw_object ,
    cities.map_draw_object_address,			
    cities.city_api_circle_center ,
    cities.city_api_circle_redius,
    cities.city_api_south_west_point,
    cities.city_api_north_east_point,
    cities.city_api_polygon,
    cities.city_api_db_polygon,
    cities.status_enum_id ,
   (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =cities.status_enum_id) city_status

    from masters.tbl_map_city  cities 
     inner join masters.tbl_map_state states on
      states.map_state_id =cities.map_state_id
	  inner join masters.tbl_map_country countrys on
	  countrys.map_country_id =states.map_country_id 
	  where      
      UPPER(TRIM(countrys.map_country_name)) =UPPER(TRIM($1)) and 
   (UPPER(TRIM(states.map_state_name)) = UPPER(TRIM($2)) OR $2 ='' ) and
    (UPPER(TRIM(cities.map_city_name)) =UPPER(TRIM($3)) OR $3=''OR UPPER(TRIM(cities.user_city_name)) =UPPER(TRIM($3)))
    order by countrys.map_country_name,states.map_state_name ,cities.map_city_name asc  `;
      },
    },

    //UPPER(TRIM(emailid))=UPPER(TRIM($1))

   
    farePlanMasters:
    {
        getfareIdList: () => {
            return `select map_city_id , area_id ,model_id,aplicable_date from masters.tbl_fare_plan where id = $1 limit 1`;
        },
        insertFarePlanDetail:  ()=>
        {
            return `insert into masters.tbl_fare_plan
            (
                map_city_id ,area_type_enum_id,area_id ,model_id ,aplicable_date ,per_minute_rate_monday ,
                per_minute_rate_tuesday ,per_minute_rate_wednesday ,per_minute_rate_thursday ,per_minute_rate_friday ,
                per_minute_rate_saturday ,per_minute_rate_sunday ,status_enum_id ,createdon_date ,created_by_id ,hire_minuts                
            )
            values 
            (
            $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16
            ) returning id;`;

        },

        

        getFarePlanDetails:()=>
        {
            return `select 
            fp.id,          
            fp.hire_minuts ,
            (select s.map_state_id from masters.tbl_map_state s where  s.map_state_id = cityMap.map_state_id) state_id,
            (select s.map_state_name from masters.tbl_map_state s where  s.map_state_id =cityMap.map_state_id) state_name,

            fp.area_type_enum_id,
           (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =fp.area_type_enum_id ) area_type,
            fp.area_id ,
            ( select ar.name from masters.tbl_area ar where ar.id = fp.area_id) area_name, 
            fp.model_id ,
			tblvehmod.model_name,
			tblvehmod.vehicle_type,
			(select tblvt.name from masters.tbl_vehicle_type tblvt where tblvt.id = tblvehmod.vehicle_type)  vehicle_type_name,
            
            fp.aplicable_date ,fp.per_minute_rate_monday ,
            fp.per_minute_rate_tuesday ,fp.per_minute_rate_wednesday ,fp.per_minute_rate_thursday ,fp.per_minute_rate_friday ,
            fp.per_minute_rate_saturday ,fp.per_minute_rate_sunday ,fp.status_enum_id ,fp.createdon_date ,fp.created_by_id ,
			 fp.status_enum_id,
           (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =fp.status_enum_id ) status ,
           fp.map_city_id ,
		   cityMap.map_city_name
           
            from  masters.tbl_fare_plan  fp        
			inner join  masters.tbl_map_city  cityMap on
			cityMap.map_city_id = fp.map_city_id
			inner join masters.tbl_vehicle_model tblvehmod on
			tblvehmod.id= fp.model_id
			where (fp.id = $1 or  $1 =0 )  
			 and  (fp.map_city_id= $2 or  $2=0)
			 and  (fp.model_id= $3 or  $3=0)
			 and (fp.area_id = $4 or  $4 =0)
			 and (fp.status_enum_id=$5 or  $5 =0)
`
        },
        updateFarePlanDetail:()=>
        {
        return `update masters.tbl_fare_plan set 
                 map_city_id =$2 ,
                 area_type_enum_id=$3,
                 area_id =$4,

                 model_id=$5 ,
                 aplicable_date=$6 ,
                 per_minute_rate_monday=$7 ,

                 per_minute_rate_tuesday=$8 ,
                 per_minute_rate_wednesday=$9 ,
                 per_minute_rate_thursday=$10 ,

                 per_minute_rate_friday=$11 ,
                 per_minute_rate_saturday=$12 
                 ,per_minute_rate_sunday=$13 ,

                 status_enum_id=$14 ,
                 updatedon_date =$15,

                 created_by_id =$16,
                 hire_minuts = $17                 

                 where id =$1`
        },

        getArea: () => {
            return `select name , map_city_id from masters.tbl_area  where id = $1 limit 1`;
        },
        getModel: () => {
            return `select model_name from masters.tbl_vehicle_model  where
			id= $1`;
        },
        getLockNumber: () => {
            return `select lock_number FROM inventory.tbl_lock_detail  WHERE id = $1`;
        },
        checkFareCloseExists: () => 
        {
           // farePlanId, cityId, modelId, areaTypeEnumId, areaId, aplicableDate
            return `SELECT id FROM masters.tbl_fare_plan where 
            map_city_id=$2 and
            area_type_enum_id =$3 and
            (area_id=$4 or $4=0) and
            model_id=$5 and
            aplicable_date=$6 and
            id <> $1 limit 1`
        },

      
        getuidModelData: () => {
            return `select id  FROM inventory.tbl_uid where  id =$1 and model_id =$2 `;
        },
        getQrNumberExistData: () => {
            return `select id  FROM inventory.tbl_product_bike where  id <> $1 and qr_number= $2 `;
        },
        getReportBike: () => 
        {   
            return `select 
    rb.id,
	rb.user_id,
	(select ad.user_name from admin.tbl_admin  ad where ad.id = rb.user_id limit 1 ),
    rb.vehicle_model_id,
    rb.vehicle_uid_id,
	(select tblvehmod.model_name  FROM masters.tbl_vehicle_model tblvehmod where tblvehmod.id= rb.vehicle_model_id )as model_name,
    (select tblvehmod.model_uid FROM inventory.tbl_uid tblvehmod where tblvehmod.id = rb.vehicle_uid_id) model_uid_number,
     rb.vehicle_lock_id,
	(select tblvehmod.lock_number  FROM inventory.tbl_lock_detail tblvehmod where tblvehmod.id= rb.vehicle_lock_id ) as lock_number,
    rb.ride_booking_min ,
    rb.from_ride_time ,
    rb.to_ride_time ,
    rb.actual_ride_time ,
    rb.actual_ride_min ,
    rb.total_ride_amount  ,
    rb.ride_start_latitude,
    rb.ride_start_longitude,
    rb.ride_end_latitude,
    rb.ride_end_longitude,
    rb.bike_rideing_status  ,
	rb.minimum_hiring_time ,
    rb.minimum_rent_rate ,
    rb.end_ride_user_id ,
    (select ad.user_name from admin.tbl_admin  ad where ad.id = rb.end_ride_user_id limit 1 ) end_ride_user_name,
    rb.bike_id  ,
    rb.ride_booking_no ,
    rb.ride_rating ,rb.ride_comments ,rb.ride_Comments_reply ,rb.comments_reply_status_enum_id,
    (select enum_key from public.tbl_enum where  enum_id =rb.comments_reply_status_enum_id) comments_reply_status_name
	from admin.tbl_ride_booking rb
	where 
    (rb.user_id =$1 OR  $1=0)
	and (rb.id = $2 OR $2=0)
	order by id desc`
        },


    },

    RideEarningReports:
    {
       userWiseRideEarningQuery:()=>
       {
        return `select 
        count(rb.id) as total_ride,
        sum(rb.total_ride_amount) as total_ride_amount,
        rb.user_id,
        ad.user_name,
        ad.mobile   
        from admin.tbl_ride_booking rb
        inner join admin.tbl_admin ad on
        ad.id =rb.user_id
        inner join inventory.tbl_lock_detail tblvehmod on
        tblvehmod.id= rb.vehicle_lock_id
        left join masters.tbl_zone_detail szd on
         rb.ride_start_zone_id = szd.id 
       left join masters.tbl_area sar on 
       szd.area_id = sar.id
       left join masters.tbl_map_city scities on   
       scities.map_city_id=sar.map_city_id 
       left join masters.tbl_map_state sstates on
       sstates.map_state_id =scities.map_state_id	
       
       left join masters.tbl_zone_detail ezd on
         rb.ride_start_zone_id = ezd.id 
       left join masters.tbl_area ear on 
       ezd.area_id = ear.id
        ---left join masters.tbl_map_city ecities on   
        --ecities.map_city_id=ear.map_city_id 
        --left join masters.tbl_map_state estates on
        ---estates.map_state_id =ecities.map_state_id
        
        where
        rb.from_ride_time  between $1 and $2
        and (rb.user_id =$3 or $3=0)
		and (rb.bike_id= $4 or $4=0)
        and (rb.bike_rideing_status= $5 OR $5=0)		
        and (UPPER(TRIM(ad.user_name)) LIKE '%' || UPPER(TRIM($6)) ||'%'  OR $6 ='')
        and (ad.mobile LIKE '%' || $7 ||'%'  OR  $7='')
        and (tblvehmod.lock_number LIKE '%' || $8 || '%' OR $8='' )  
		
		
        and (sstates.map_state_id= any($9) OR $9 = ('{0}') ) 
        and ((scities.map_city_id) = any($10) OR $10 =('{0}'))
		and (sar.area_type_enum_id = any($11) OR $11 =('{0}'))		
		and (sar.id = any($12) OR $12 =('{0}'))
		and(rb.ride_start_zone_id = any($13) OR $13 =('{0}'))				
		and (ear.id  =any($14) OR $14 =('{0}'))
		and(rb.ride_end_zone_id = any($15) OR $15 =('{0}'))   
         group by rb.user_id ,ad.user_name,ad.mobile`
       },



       bikeWiseRideEarningQuery:()=>
       {
        return `select 
        count(rb.id) as no_of_ride, 
        sum(rb.total_ride_amount) as total_ride_amount,
        pb.id  as bike_id,
        pb.bike_name 
       -- tblvehmod.lock_number,
        --tblvehmod.id      
        from   admin.tbl_ride_booking rb  
        inner join inventory.tbl_product_bike pb  on        
         pb.id = rb.bike_id
         inner join admin.tbl_admin ad on
         ad.id = rb.user_id
         inner join inventory.tbl_lock_detail tblvehmod on
         tblvehmod.id= rb.vehicle_lock_id

         left join masters.tbl_zone_detail szd on
         rb.ride_start_zone_id = szd.id 
       left join masters.tbl_area sar on 
       szd.area_id = sar.id
       left join masters.tbl_map_city scities on   
       scities.map_city_id=sar.map_city_id 
       left join masters.tbl_map_state sstates on
       sstates.map_state_id =scities.map_state_id	
       
       left join masters.tbl_zone_detail ezd on
         rb.ride_start_zone_id = ezd.id 
       left join masters.tbl_area ear on 
       ezd.area_id = ear.id
        ---left join masters.tbl_map_city ecities on   
        --ecities.map_city_id=ear.map_city_id 
        --left join masters.tbl_map_state estates on
        ---estates.map_state_id =ecities.map_state_id
        where 
        rb.from_ride_time  between $1 and $2
        and (rb.user_id =$3 or $3=0)
		and (rb.bike_id= $4 or $4=0)
        and (rb.bike_rideing_status= $5 OR $5=0)		
        and (UPPER(TRIM(ad.user_name)) LIKE '%' || UPPER(TRIM($6)) ||'%'  OR $6 ='')
        and (ad.mobile LIKE '%' || $7 ||'%'  OR  $7='')
        and (tblvehmod.lock_number LIKE '%' || $8 || '%' OR $8='' )  
		
		
        and (sstates.map_state_id= any($9) OR $9 = ('{0}') ) 
        and ((scities.map_city_id) = any($10) OR $10 =('{0}'))
		and (sar.area_type_enum_id = any($11) OR $11 =('{0}'))		
		and (sar.id = any($12) OR $12 =('{0}'))
		and(rb.ride_start_zone_id = any($13) OR $13 =('{0}'))				
		and (ear.id  =any($14) OR $14 =('{0}'))
		and(rb.ride_end_zone_id = any($15) OR $15 =('{0}'))
        group by pb.id,pb.bike_name `
       },

       userIdOrBikeIdWiseRideEarningDetailQuery:()=>
       {
        return `select        
        rb.from_ride_time ,
        rb.actual_ride_time ,    
        rb.minimum_hiring_time,
        rb.minimum_rent_rate,
        ad.user_name ,
        ad.mobile ,
       -- (select ad.user_name from admin.tbl_admin  ad where ad.id = rb.user_id limit 1 ) as user_name,
        --(select ad.mobile from admin.tbl_admin  ad where ad.id = rb.user_id limit 1 ) as mobile,
		pb.bike_name ,	
        (select tblvehmod.model_name  FROM masters.tbl_vehicle_model tblvehmod where tblvehmod.id= rb.vehicle_model_id )as model_name,
        (select tblvehmod.model_uid FROM inventory.tbl_uid tblvehmod where tblvehmod.id = rb.vehicle_uid_id) model_uid_number,     
        --(select tblvehmod.lock_number  FROM inventory.tbl_lock_detail tblvehmod where tblvehmod.id= rb.vehicle_lock_id ) as lock_number,
        tblvehmod.lock_number ,
        rb.actual_ride_min ,
        (select ad.user_name from admin.tbl_admin  ad where ad.id = rb.end_ride_user_id limit 1 ) end_ride_user_name  ,
        rb.total_ride_amount ,
        rb.bike_rideing_status ,
        rb.remark as end_ride_remark ,
        (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =rb.bike_rideing_status ) bike_rideing_status ,
        rb.ride_start_zone_id ,
        ( select name  from masters.tbl_zone_detail where id = rb.ride_start_zone_id) as ride_start_zone_name ,       
        rb.ride_end_zone_id ,
        ( select name  from masters.tbl_zone_detail where id = rb.ride_end_zone_id) as end_start_zone_name ,
        rb.ride_booking_no ,
        rb.device_lock_count,
        rb.device_unlock_count ,
        rb.ride_rating ,
        rb.ride_comments ,
        rb.ride_comments_reply ,
        rb.comments_reply_status_enum_id ,
        rb.rating_comments_date ,
        rb.comments_reply_date ,
        rb.distance_in_meters ,
        scities.map_city_name ,
        sstates.map_state_name
        from admin.tbl_ride_booking rb
		inner join inventory.tbl_product_bike pb on 
		pb.id =rb.bike_id
        inner join admin.tbl_admin ad on
        ad.id = rb.user_id
        inner join inventory.tbl_lock_detail tblvehmod on
        tblvehmod.id= rb.vehicle_lock_id
		
        left join masters.tbl_zone_detail szd on
        rb.ride_start_zone_id = szd.id 
	  left join masters.tbl_area sar on 
	  szd.area_id = sar.id
	  left join masters.tbl_map_city scities on   
      scities.map_city_id=sar.map_city_id 
	  left join masters.tbl_map_state sstates on
      sstates.map_state_id =scities.map_state_id	
	  
	  left join masters.tbl_zone_detail ezd on
        rb.ride_start_zone_id = ezd.id 
	  left join masters.tbl_area ear on 
	  ezd.area_id = ear.id
       ---left join masters.tbl_map_city ecities on   
       --ecities.map_city_id=ear.map_city_id 
	   --left join masters.tbl_map_state estates on
       ---estates.map_state_id =ecities.map_state_id	
	  
        where 
        rb.from_ride_time  between $1 and $2
        and (rb.user_id =$3 or $3=0)
		and (rb.bike_id= $4 or $4=0)
        and (rb.bike_rideing_status= $5 OR $5=0)		
        and (UPPER(TRIM(ad.user_name)) LIKE '%' || UPPER(TRIM($6)) ||'%'  OR $6 ='')
        and (ad.mobile LIKE '%' || $7 ||'%'  OR  $7='')
        and (tblvehmod.lock_number LIKE '%' || $8 || '%' OR $8='' )  
		
		
        and (sstates.map_state_id= any($9) OR $9 = ('{0}') ) 
        and (scities.map_city_id = any($10) OR $10 =('{0}'))
		and (sar.area_type_enum_id = any($11) OR $11 =('{0}'))		
		and (sar.id = any($12) OR $12 =('{0}'))        
		and(rb.ride_start_zone_id = any($13) OR $13 =('{0}'))	

		and (ear.id  =any($14) OR $14 =('{0}'))
		and(rb.ride_end_zone_id = any($15) OR $15 =('{0}'))`
       },
   
       rideReportDetailQuery:()=>
       {
        return `select 
        rb.id,
        rb.from_ride_time ,
        rb.to_ride_time ,    
        rb.user_id,
        (select ad.user_name from admin.tbl_admin  ad where ad.id = rb.user_id limit 1 ) as user_name,
        (select ad.mobile from admin.tbl_admin  ad where ad.id = rb.user_id limit 1 ) as mobile,
        rb.bike_id,
        rb.vehicle_lock_id,
        rb.vehicle_model_id,
        rb.vehicle_uid_id,	
        (select tblvehmod.model_name  FROM masters.tbl_vehicle_model tblvehmod where tblvehmod.id= rb.vehicle_model_id )as model_name,
        (select tblvehmod.model_uid FROM inventory.tbl_uid tblvehmod where tblvehmod.id = rb.vehicle_uid_id) model_uid_number,     
        (select tblvehmod.lock_number  FROM inventory.tbl_lock_detail tblvehmod where tblvehmod.id= rb.vehicle_lock_id ) as lock_number,
        rb.ride_booking_min ,
       rb.actual_ride_min ,
        rb.end_ride_user_id ,
        (select ad.user_name from admin.tbl_admin  ad where ad.id = rb.end_ride_user_id limit 1 ) end_ride_user_name  ,
        rb.total_ride_amount ,
        rb.remark

        from admin.tbl_ride_booking rb
        where rb.bike_rideing_status= $3
        and rb.from_ride_time  between $1 and $2`
       }  ,


    },


    deviceLogInfoReports:
    {
       LogInfoReportsQuery:()=>
       {
        return `
        select 
        id,
        lock_id ,
        device_id ,  
        createdon_date, 
        speed,
        location ,
        latitude ,
        longitude ,
        battery ,
        internal_batt_v ,
        external_batt_v ,
        altitude ,   
        device_lock_and_unlock_status ,
        instruction_id ,    
        (select name from masters.tbl_device_lock_status where id = device_lock_and_unlock_status) lock_status ,
        (select name from masters.tbl_device_instractions where id = instruction_id)  instruction_name ,
        device_light_status_enum_id ,
        (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =device_light_status_enum_id)as deveice_light_status,
        device_light_instruction_enum_id ,
        (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =device_light_instruction_enum_id)as device_light_instruction,
        ride_booking_id ,
        (select ride_booking_no from admin.tbl_ride_booking where id =ride_booking_id limit 1) ride_booking_no,
        beep_instruction_enum_id  ,
        (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =beep_instruction_enum_id)as beep_instruction,
        beep_status_enum_id  ,  
        (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =beep_status_enum_id)as beep_status ,
        power_status_enum_id ,
        (select tenum.enum_key from public.tbl_enum tenum where  tenum.enum_id =power_status_enum_id)as power_status 
        from admin.tbl_add_device_information_log 	
        where lock_id =$1 
        and createdon_date between  $2  and $3  

        and (
        (($4='available' and speed is not null) or ($4 = 'not available' and speed is null) or ($4='both'))

        or (($5='available' and latitude is not null) or ($5 = 'not available' and latitude is null) or ($5='both'))         
		or (($6='available' and longitude is not null) or ($6 = 'not available' and longitude is null) or ($6='both'))
         
		or (($7='available' and battery is not null) or ($7 = 'not available' and battery is null) or ($7='both'))     

		or (($8='available' and internal_batt_v is not null) or ($8 = 'not available' and internal_batt_v is null) or ($8='both'))         
		or (($9='available' and external_batt_v is not null) or ($9 = 'not available' and external_batt_v is null) or ($9='both'))     

		or (($10='available' and altitude is not null) or ($10 = 'not available' and altitude is null) or ($10='both'))
		
		or (($11='available' and device_light_status_enum_id is not null) or ($11 = 'not available' and device_light_status_enum_id is null) or ($11='both'))        
		or (($12='available' and device_light_instruction_enum_id is not null) or ($12 = 'not available' and device_light_instruction_enum_id is null) or ($12='both'))  

		or (($13='available' and instruction_id is not null) or ($13 = 'not available' and instruction_id is null) or ($13='both'))         
		or (($14='available' and device_lock_and_unlock_status is not null) or ($14 = 'not available' and device_lock_and_unlock_status is null) or ($14='both'))

        or (($15='available' and beep_instruction_enum_id is not null) or ($15 = 'not available' and beep_instruction_enum_id is null) or ($15='both'))         
		or (($16='available' and beep_status_enum_id is not null) or ($16 = 'not available' and beep_status_enum_id is null) or ($16='both'))
        or (($17='available' and power_status_enum_id is not null) or ($17 = 'not available' and power_status_enum_id is null) or ($17='both'))        
        )`
       },

       lockUnlcokdeviceLogInfoReportsQuery:()=>
       {
        return `select 
        id,
        lock_id ,
        device_id ,  
        createdon_date, 
        device_lock_and_unlock_status ,
        instruction_id ,    
        (select name from masters.tbl_device_lock_status where id = device_lock_and_unlock_status) lock_status ,
        (select name from masters.tbl_device_instractions where id = instruction_id)  instruction_name ,
        ride_booking_id 
        from admin.tbl_add_device_information_log 	
        where  lock_id =$1 and device_id =$2 
        and createdon_date between  $3  and $4
      --  and device_lock_and_unlock_status !=null
        --and instruction_id !=null
        order by id desc `
       },
       
       deviceLogInfoReportsQuery:()=>
       {
        return ` select 
        id,
        lock_id ,
        device_id ,  
        createdon_date,        
        location ,
        speed ,
        latitude ,
        longitude ,
        battery ,
        internal_batt_v ,
        external_batt_v ,
        altitude ,   
        ride_booking_id 
        from admin.tbl_add_device_information_log 	
        where lock_id =$1 and device_id =$2 
        and createdon_date between  $3  and $4      
        order by id desc`
       },  
       
       
   
    }
};
