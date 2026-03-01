import RequestResponse from './responseClass';



const catchAsync = (fn: any) => (req: Request, res: Response, next: any) => {
    Promise.resolve(fn(req, res, next)).catch((err) => next(err.message));
};

export default catchAsync;
