export const DB_CONFIGS = {
    paymentQueries: {
        insertPaymentPatewayTransction:()=>
        {
            return `INSERT INTO payment.tbl_Payment_gateway_transction(
                user_id, order_id, amount, payment_transction_enum_id, zaakpay_payment_status_enum_id,status_enum_id,createdon_date,client_return_url,createdby_login_user_id)
               VALUES ($1, $2, $3, $4, $5, $6, $7,$8,$9) RETURNING id;`
         
        },
        getUserEmailId:()=>
        {
            return `select emailid from admin.tbl_admin where id = $1;`         
        },
        updatePaymentPatewayTransction:()=>
        {
            return `update payment.tbl_Payment_gateway_transction set 
                    payment_json =$1,
                    zaakpay_payment_status_enum_id = $2,
                    updatedon_date = $3,
                    payment_transaction_id= $5,
                    updated_login_user_id =$6
                    where id = $4
                    `   
        },
        insertZaakPaymentTransaction: () => {
            return `INSERT INTO admin.tbl_payment_transaction_details(
                user_id, 
                payment_id,
                amount,

                order_id,
                zaakpay_response_code,
                zaakpay_response_description,

                zaakpay_checksum,
                zaakpay_do_redirect,
                zaakpay_payment_mode,

                zaakpay_card_id,
                zaakpay_card_scheme,
                zaakpay_card_token,

                zaakpay_bank_id,
                zaakpay_payment_method,
                zaakpay_cardhashid,

                zaakpay_product_description,
                zaakpay_product1_description,
                zaakpay_product2_description,

                zaakpay_product3_description,
                zaakpay_product4_description,
                zaakpay_pg_trans_id,

                zaakpay_pg_trans_time,
                online_payment_status_enum_id,
                payment_gatway,

                bank,
                createdby_login_user_id,
                createdon_date,
                
                created_at ,
                payment_order_no
                )
                VALUES ( $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22,$23, $24,$25,$26,$27,$28,$29) RETURNING id;`;
             },


             getTransactions: () =>
             {
                return `select  id from admin.tbl_payment_transaction_details where order_id =$1`
             },
             getClientUrl: () =>
             {
                return `select client_return_url from  payment.tbl_Payment_gateway_transction where id =$1`
            },
        
    }
}