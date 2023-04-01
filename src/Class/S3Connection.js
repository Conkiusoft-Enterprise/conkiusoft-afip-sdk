const { S3Client, PutObjectCommand, GetObjectCommand  } = require("@aws-sdk/client-s3");


module.exports = class S3Connection {

    constructor(S3_REGION,S3_CREDENTIAL_ID,S3_CREDENTIAL_KEY){

       this.s3Connection = new S3Client({
            region: S3_REGION,
            credentials: {
                accessKeyId: S3_CREDENTIAL_ID,
                secretAccessKey: S3_CREDENTIAL_KEY
            }
        });

        this.bucket = 'rollosnp-resources';
	}

    async writeFileS3(fileName,body) {
        const params = new PutObjectCommand({
            Body: body,
            Bucket:this.bucket,
            Key: fileName

        });
        try{
            await this.s3Connection.send(params);
        }catch(e){
            console.log(e);
            throw(e);
        }
    } 

    async readFileS3(fileName) {
		const params = new GetObjectCommand({
            Bucket:this.bucket,
            Key:fileName

        });

        try{
            const response = await this.s3Connection.send(params);

            if(response && response.Body){
                const token = await response.Body.transformToString();
                return token ? JSON.parse(token) : null;
            }
            
            throw("No fue posible acceder a al archivo afip token")

        }catch(e){
            console.log(e);
            throw(e);
        }
	}
}