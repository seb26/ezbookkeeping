package cmd

import (
	"encoding/binary"
	"fmt"
	"net"

	"github.com/urfave/cli/v2"

	"github.com/mayswind/ezbookkeeping/pkg/requestid"
	"github.com/mayswind/ezbookkeeping/pkg/utils"
)

// Utilities represents the utilities command
var Utilities = &cli.Command{
	Name:  "utility",
	Usage: "ezBookkeeping utilities",
	Subcommands: []*cli.Command{
		{
			Name:   "parse-default-request-id",
			Usage:  "Parse a request id which is generated by default request generator and show the details",
			Action: parseRequestId,
			Flags: []cli.Flag{
				&cli.StringFlag{
					Name:     "id",
					Required: true,
					Usage:    "Request ID",
				},
			},
		},
	},
}

func parseRequestId(c *cli.Context) error {
	config, err := initializeSystem(c)

	if err != nil {
		return err
	}

	err = requestid.InitializeRequestIdGenerator(config)
	defaultGenerator, err := requestid.NewDefaultRequestIdGenerator(config)

	if err != nil {
		return err
	}

	requestId := c.String("id")
	requestIdInfo, err := defaultGenerator.ParseRequestIdInfo(requestId)

	if err != nil {
		return err
	}

	newRequestId := defaultGenerator.GenerateRequestId(net.IPv4zero.String())
	newRequestIdInfo, err := defaultGenerator.ParseRequestIdInfo(newRequestId)
	printRequestIdInfo(requestId, requestIdInfo, newRequestIdInfo)

	return nil
}

func printRequestIdInfo(requestId string, requestIdInfo *requestid.RequestIdInfo, newRequestIdInfo *requestid.RequestIdInfo) {
	fmt.Printf("[RequestId] %s\n", requestId)
	fmt.Printf("[ServerUniqId] %d (Current Server %d)\n", requestIdInfo.ServerUniqId, newRequestIdInfo.ServerUniqId)
	fmt.Printf("[InstanceUniqId] %d (Current Server %d)\n", requestIdInfo.InstanceUniqId, newRequestIdInfo.InstanceUniqId)

	displayTime, err := utils.ParseFromElapsedSeconds(int(requestIdInfo.SecondsElapsedToday))

	if err == nil {
		fmt.Printf("[SecondsElapsedToday] %d (%s)\n", requestIdInfo.SecondsElapsedToday, displayTime)
	} else {
		fmt.Printf("[SecondsElapsedToday] %d\n", requestIdInfo.SecondsElapsedToday)
	}

	fmt.Printf("[RandomNumber] %d\n", requestIdInfo.RandomNumber)
	fmt.Printf("[RequestSeqId] %d\n", requestIdInfo.RequestSeqId)
	fmt.Printf("[IsClientIpv6] %t\n", requestIdInfo.IsClientIpv6)

	if requestIdInfo.IsClientIpv6 {
		fmt.Printf("[ClientIpv6Hash] %d\n", requestIdInfo.ClientIp)
	} else {
		ip := make(net.IP, 4)
		binary.BigEndian.PutUint32(ip, requestIdInfo.ClientIp)
		fmt.Printf("[ClientIpv4] %s\n", ip.String())
	}
}
