/*
 * Copyright 2013 Palantir Technologies, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

///<reference path='classifier.ts' />
///<reference path='languageService.ts' />
///<reference path='map.ts' />

/**
  * This module provides an interface between stdin, stdout and many of the TypeScript services.
  *
  * @author tyleradams
  */
module Bridge {

    export class Main {

        private services: Map<string, any>;

        constructor() {
            this.services = new Map();
            this.services.set("classifier", new ClassifierService());
            this.services.set("language service", new LanguageServiceHostService());
        }

        public run() {
            var myProcess: any = process;

            var requestJson = "";
            myProcess.stdin.resume();
            myProcess.stdin.on("data", (chunk: string) => {
                requestJson += chunk;

                // process the request if it is complete (this may fail in some cases)
                if (/}$/.test(requestJson)) {
                    var response = this.processRequest(requestJson);
                    var responseJson = JSON.stringify(response);

                    // write the response to stdout
                    console.log(responseJson);

                    // reset for the next request
                    requestJson = "";
                }
            });
        }

        private processRequest(requestJson: string): any {
            // parse the data chunk
            var request;
            try {
                request = JSON.parse(requestJson);
            } catch (e) {
                return {error: e.message};
            }

            // get the service
            var service = this.services.get(request.service);
            if (service === null) {
                return {error: "Invalid service: " + request.service};
            }

            // process the request
            var method = service[request.command];
            var response = method.apply(service, request.args);

            return response;
        }
    }
}

var main = new Bridge.Main();
main.run();
