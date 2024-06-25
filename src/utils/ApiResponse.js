class ApiResponse{
    constructor(statusCode,data,message = "Success"){
        this.statusCode = statusCode
        this.data = data
        this.message = message
        this.success = statusCode < 400
    }
}

export {ApiResponse}

// By using ApiResponse, you ensure a consistent response structure for your API,
//  which can be very helpful for clients consuming your API.
//  The combination of ApiResponse and ApiError allows you to manage both successful responses
//  and error handling in a clean and standardized way.