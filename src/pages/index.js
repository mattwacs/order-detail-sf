import React, { useState, useEffect } from "react";
import { CircularProgress } from "@mui/material";
import { Divider } from "@mui/material";
import CancelIcon from '@mui/icons-material/Cancel';
import CheckBoxIcon from '@mui/icons-material/CheckBox';

import { green, red, orange } from "@mui/material/colors";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [finalData, setFinalData] = useState([]);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const orderId = searchParams.get("order_id");

    if (orderId) {
      setIsLoading(true);
      getOrderDetails(orderId);
    } else {
      setError({
        error: 400,
        message: "No Order ID provided",
      });
    }
  }, []);

  const getOrderDetails = async (orderId) => {
    try {
      const response = await fetch(`/api/sf_order_items?order_id=${orderId}`);
      const data = await response.json();

      if (data.OrderItems && data.OrderItems.records && data.OrderItems.records.length > 0) {
        const orderItems = data.OrderItems.records;
        console.log('order items', orderItems);

        const productDataSf = orderItems.map((item) => {
          return {
            part_number: item.Product2.Parent_Part_NetSuite_ID__c,
            name: item.Product2.Name,
            description: item.Product2.Description,
          }
        });
        const itemIds = orderItems.map((item) => item.Product2.Parent_Part_NetSuite_ID__c);

        if (itemIds.length > 0) {
          getNetsuiteData(itemIds, productDataSf);
        }
      }
    } catch (err) {
      console.error(err);
      setError(err);
      setIsLoading(false);
    }
  };

  const getNetsuiteData = async (itemIds, productDataSf) => {
    try {
      const queryString = JSON.stringify(itemIds);
      const response = await fetch(`/api/ns_oauth?item_ids=${queryString}`);
      const data = await response.json();

      console.log('netsuite data', data);
      if (data.error) {
        setError(data.error);
      }
      if (data && data.length > 0) {
        
        const mergedData = data.map((item) => {
          const sfItem = productDataSf.find((sfItem) => sfItem.part_number === item.id);
          console.log('sfItem', sfItem, 'item.id', item.id);

          if (sfItem) {
            return {
              ...item,
              product_name: sfItem.name,
              product_description: sfItem.description,
            };
          } else {
            return item;
          }
        });

        console.log('final data', mergedData);
        setFinalData(mergedData);
      }
    } catch (err) {
      console.error(err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }

  function checkForBackorder(item) {
    return item.locations && item.locations.some(location =>
      location.value === "1" && 
      location.quantitybackordered !== "" && 
      parseInt(location.quantitybackordered, 10) > 0
    );
  }

  function checkKitForBackorders(items) {
    return items.some(item => 
      item.locations && item.locations.some(location => 
        location.value === "1" &&
        location.quantitybackordered !== "" && 
        parseInt(location.quantitybackordered, 10) > 0
      )
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center overflow-x-scroll py-6">
      {isLoading && (
        <div className="py-10">
          <CircularProgress />
        </div>
      )}
      {error && (
        <div className="py-10 font-bold">{error.message}</div>
      )}
      <div className="max-h-600 overflow-y-scroll">
        {finalData.map((item, index) => (
          <div key={item.id} className="rounded-lg border bg-white mb-10">
          {item.type === 'inventory' ? (
            <div className="m-6">
              <h2 className="font-bold text-wrap flex items-center">
                {checkForBackorder(item) ? (
                  <CancelIcon sx={{ color: red[500], marginRight: '5px' }} />
                ) : (
                  <CheckBoxIcon sx={{ color: green[500], marginRight: '5px' }} />
                )}
                {item.product_description}{' '}{'('}{item.name}{')'}
              </h2>
              {item.locations && item.locations.length > 0 ? (
                <table className="w-full text-xs text-left">
                  <thead className="text-xs uppercase border-b">
                    <tr>
                      <th scope="col" className="px-4 py-3 max-w-sm text-center">
                          Location
                      </th>
                      <th scope="col" className="px-4 py-3 text-center">
                          On Hand
                      </th>
                      <th scope="col" className="px-4 py-3 text-center">
                          Comitted
                      </th>
                      <th scope="col" className="px-4 py-3 text-center">
                          Back Ordered
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.locations.map((location) => (
                      <tr key={location.value} className="border-b">
                        <td className="px-4 py-2 border-r max-w-sm min-w-sm">{location.text}</td>
                        <td className="px-4 py-2 text-center border-r">{location.quantityonhand !== "" ? location.quantityonhand : 0}</td>
                        <td className="px-4 py-2 text-center border-r">{location.quantitycommitted !== "" ? location.quantitycommitted : 0}</td>
                        <td className="px-4 py-2 text-center">{location.quantitybackordered !== "" ? location.quantitybackordered : 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className='mt-4 text-xs font-bold'>No Inventory details available.</p>
              )}
              {item.purchaseOrders && item.purchaseOrders.length > 0 ? (
                <table className='w-full text-xs text-left mt-2'>
                  <thead className='text-xs uppercase border-b'>
                    <tr>
                      <th scope="col" className='px-4 py-3 max-w-sm text-center'>
                        Date
                      </th>
                      <th scope="col" className='px-4 py-3 max-w-sm text-center'>
                        PO #
                      </th>
                      <th scope="col" className='px-4 py-3 max-w-sm text-center'>
                        Vendor
                      </th>
                      <th scope="col" className='px-4 py-3 text-center'>
                        Quantity
                      </th>
                      <th scope="col" className='px-4 py-3 text-center'>
                        EXP Delivery Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.purchaseOrders.map((po) => (
                      <tr key={po.tranid} className='border-b'>
                        <td className='px-4 py-2 border-r max-w-sm text-center'>{po.trandate}</td>
                        <td className='px-4 py-2 border-r max-w-sm text-center'>{po.tranid}</td>
                        <td className='px-4 py-2 border-r max-w-sm text-center'>{po.vendor}</td>
                        <td className='px-4 py-2 border-r text-center'>{po.quantity}</td>
                        <td className='px-4 py-2 text-center'>{po.expectedreceiptdate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className='mt-4 text-xs font-bold'>No open Purchase Orders found.</p>
              )}
            </div>
          ) : (
            <div className="m-6">
              <h2 className="font-bold text-wrap flex items-center">
                {checkKitForBackorders(item.items) ? (
                  <CancelIcon sx={{ color: red[500], marginRight: '5px' }} />
                ) : (
                  <CheckBoxIcon sx={{ color: green[500], marginRight: '5px' }} />
                )}
                {item.product_description}{' '}{'(KIT ITEM)'}
                {/* {item.product_description}{' '}{'('}{item.name}{')'} */}
              </h2>
              {item.items && item.items.length > 0 ? item.items.map((kitItem, index) => (
                <div key={kitItem.id} className="mt-2 border px-2 py-2 rounded-md">
                  <h4 className="font-bold text-sm text-wrap flex items-center">
                    {index + 1}:{' '}{kitItem.name}
                    {' '}
                    {checkForBackorder(kitItem) ? (
                      <CancelIcon sx={{ color: red[500], fontSize: '16px', marginLeft: '5px' }} />
                    ) : (
                      <CheckBoxIcon sx={{ color: green[500], fontSize: '16px', marginLeft: '5px' }} />
                    )}
                  </h4>
                  {kitItem.locations && kitItem.locations.length > 0 ? (
                    <table className="w-full text-xs text-left">
                      <thead className="text-xs uppercase border-b">
                        <tr>
                          <th scope="col" className="px-4 py-3 max-w-sm text-center">
                              Location
                          </th>
                          <th scope="col" className="px-4 py-3 text-center">
                              On Hand
                          </th>
                          <th scope="col" className="px-4 py-3 text-center">
                              Comitted
                          </th>
                          <th scope="col" className="px-4 py-3 text-center">
                              Back Ordered
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {kitItem.locations.map((location) => (
                          <tr key={location.value} className="border-b">
                            <td className="px-4 py-2 border-r max-w-sm min-w-sm">{location.text}</td>
                            <td className="px-4 py-2 text-center border-r">{location.quantityonhand !== "" ? location.quantityonhand : 0}</td>
                            <td className="px-4 py-2 text-center border-r">{location.quantitycommitted !== "" ? location.quantitycommitted : 0}</td>
                            <td className="px-4 py-2 text-center">{location.quantitybackordered !== "" ? location.quantitybackordered : 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className='mt-4 text-xs font-bold'>No Inventory details available.</p>
                  )}
                  {kitItem.purchaseOrders && kitItem.purchaseOrders.length > 0 ? (
                    <table className='w-full text-xs text-left mt-2'>
                      <thead className='text-xs uppercase border-b'>
                        <tr>
                          <th scope="col" className='px-4 py-3 max-w-sm text-center'>
                            Date
                          </th>
                          <th scope="col" className='px-4 py-3 max-w-sm text-center'>
                            PO #
                          </th>
                          <th scope="col" className='px-4 py-3 max-w-sm text-center'>
                            Vendor
                          </th>
                          <th scope="col" className='px-4 py-3 text-center'>
                            Quantity
                          </th>
                          <th scope="col" className='px-4 py-3 text-center'>
                            EXP Delivery Date
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {kitItem.purchaseOrders.map((po) => (
                          <tr key={po.tranid} className='border-b'>
                            <td className='px-4 py-2 border-r max-w-sm text-center'>{po.trandate}</td>
                            <td className='px-4 py-2 border-r max-w-sm text-center'>{po.tranid}</td>
                            <td className='px-4 py-2 border-r max-w-sm text-center'>{po.vendor}</td>
                            <td className='px-4 py-2 border-r text-center'>{po.quantity}</td>
                            <td className='px-4 py-2 text-center'>{po.expectedreceiptdate}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className='mt-4 text-xs font-bold'>No open Purchase Orders found.</p>
                  )}
                </div>
              )) : (
                <p className='mt-4 text-xs font-bold'>No items found for kit.</p>
              )}
              {/* {item.locations && item.locations.length > 0 ? (
                <table className="w-full text-xs text-left">
                  <thead className="text-xs uppercase border-b">
                    <tr>
                      <th scope="col" className="px-4 py-3 max-w-sm text-center">
                          Location
                      </th>
                      <th scope="col" className="px-4 py-3 text-center">
                          On Hand
                      </th>
                      <th scope="col" className="px-4 py-3 text-center">
                          Comitted
                      </th>
                      <th scope="col" className="px-4 py-3 text-center">
                          Back Ordered
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.locations.map((location) => (
                      <tr key={location.value} className="border-b">
                        <td className="px-4 py-2 border-r max-w-sm min-w-sm">{location.text}</td>
                        <td className="px-4 py-2 text-center border-r">{location.quantityonhand !== "" ? location.quantityonhand : 0}</td>
                        <td className="px-4 py-2 text-center border-r">{location.quantitycommitted !== "" ? location.quantitycommitted : 0}</td>
                        <td className="px-4 py-2 text-center">{location.quantitybackordered !== "" ? location.quantitybackordered : 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className='mt-4 text-xs font-bold'>No Inventory details available.</p>
              )}
              {item.purchaseOrders && item.purchaseOrders.length > 0 ? (
                <table className='w-full text-xs text-left mt-2'>
                  <thead className='text-xs uppercase border-b'>
                    <tr>
                      <th scope="col" className='px-4 py-3 max-w-sm text-center'>
                        Date
                      </th>
                      <th scope="col" className='px-4 py-3 max-w-sm text-center'>
                        PO #
                      </th>
                      <th scope="col" className='px-4 py-3 max-w-sm text-center'>
                        Vendor
                      </th>
                      <th scope="col" className='px-4 py-3 text-center'>
                        Quantity
                      </th>
                      <th scope="col" className='px-4 py-3 text-center'>
                        EXP Delivery Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.purchaseOrders.map((po) => (
                      <tr key={po.tranid} className='border-b'>
                        <td className='px-4 py-2 border-r max-w-sm text-center'>{po.trandate}</td>
                        <td className='px-4 py-2 border-r max-w-sm text-center'>{po.tranid}</td>
                        <td className='px-4 py-2 border-r max-w-sm text-center'>{po.vendor}</td>
                        <td className='px-4 py-2 border-r text-center'>{po.quantity}</td>
                        <td className='px-4 py-2 text-center'>{po.expectedreceiptdate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className='mt-4 text-xs font-bold'>No open Purchase Orders found.</p>
              )} */}
            </div>
          )}
          </div>
        ))}
      </div>
    </main>
  );
}
