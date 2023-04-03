const { S3Client, PutObjectCommand, GetObjectCommand, NoSuchKey  } = require("@aws-sdk/client-s3");


module.exports = class S3Connection {

    constructor(s3Config,bucket,folder){
       this.s3Connection = new S3Client(s3Config);
       this.bucket = bucket;
       this.folder = folder;
	}

    async writeFileS3(fileName,body) {
        const params = new PutObjectCommand({
            Body: body,
            Bucket:this.bucket,
            Key: this.folder+fileName

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
            Key:this.folder+fileName

        });

        try{
            const response = await this.s3Connection.send(params);

            if(response && response.Body){
                const token = await response.Body.transformToString();
                return token ? JSON.parse(token) : null;
            }
            
            throw("No fue posible acceder a al archivo afip token")

        }catch(e){
            if(!(e.name === NoSuchKey.name)){
                throw(e);
            }
        }
	}
}