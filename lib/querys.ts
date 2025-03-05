import { gql } from "@apollo/client";

export const LOGIN = gql`
	mutation ($email: String!, $password: String!) {
		login(email: $email, password: $password) {
			token
			user {
				id
			}
		}
	}
`;

export const GET_TASKSLIST = gql`
	query ($size: Int, $page: Int = 0, $sort: [InputSort], $filter: [InputFilter]) {
		findTasks(size: $size, page: $page, sort: $sort, filter: $filter) {
			tasks {
				id
				code
				dailyPartDates
				status
				workOrder
				active
				asset {
					id
					name
					installationName
					depositName
					installation {
						id
						deposit {
							id
						}
					}
					typeOfAsset
					... on AssetILAP {
						bussinesUnit
					}
				}

				test {
					id
					name
					code
				}
				createdAt
				clientNotice
				reportApprovedUrl
				reportRejectedUrl
				type
				ilap
				weekTo
				weekFrom
				inputInvoice
				taskConsiderations
				reportResultDetails
				currentDailyPart {
					id
					date
					equipmentAccessories {
						equipment {
							id
							name
							serialNumber
							internalCode
							brand
							mod
							category {
								id
								name
							}
							subcategory
						}
						accessories {
							id
							name
							brand
							mod
							code
							category {
								name
							}
							subcategory
						}
					}
					supplies {
						name
						extras
					}
				}
				contract {
					id
					number
					vehicles
					costCenter
					client {
						id
						name
						logoUrl
					}
				}

				history {
					id
					dailyPart {
						id
						code
						costCenter
						date
					}
					user {
						id
						name
						lastname
					}
					status
					updatedAt
				}
				... on TaskILAP {
					serviceOrder

					pieces {
						reportUrl
						piece {
							imgUrl
							id
							serialNumber
							brand
							pressure
							sealNumber
							sealColor
							sealExpiration
						}
					}
				}
				... on Task {
					reportComplete
					reportStatus
				}
			}
			count
		}
	}
`;

export const GET_PIPING_RECORDS = gql`
	query ($size: Int, $page: Int, $sort: [InputSort], $filter: [InputFilter]) {
		findExternalPipingRecords(size: $size, page: $page, sort: $sort, filter: $filter) {
			records {
				id
				active
				material
				designPressure
				designTemperature
				diameter
				equipmentCondition
				fluid
				items {
					name
					observations
					status
				}
				material
				operationalPressure
				operationalTemperature
				schedule

				task {
					asset {
						name
					}
					currentDailyPart {
						code
						date
						costCenter
						operator {
							name
							lastname
						}
						vehicle
					}
				}
			}
			count
		}
	}
`;

export const CREATE_EXTERAL_PIPING_RECORD = gql`
	mutation ($record: InputCreateExternalPipingRecord) {
		createExternalPipingRecord(record: $record) {
			id
		}
	}
`;
