import FilesSchema from "../model/FilesSchema.js";

const saveUserFilesInSchema = async (userId,fileNames)=>{
    try{
        console.log("saving user file in UserSchema");

        let userFilesData = await FilesSchema.find({userId})
        if (!userFilesData) {
            userFilesData = await FilesSchema.create();
            userFilesData.userId = userId;
        }
        console.log(userFilesData);

        userFilesData.fileNames = Array.from(
            new Set([...userFilesData.fileNames, ...fileNames])
        );

        const promiseArr = [
            userFilesData.save()
        ];

        await Promise.all(promiseArr);
        return "successfully saved";

    }
    catch (err) {
        console.log("exception occurred : "+err);
        throw err;
    }
}

export default saveUserFilesInSchema
