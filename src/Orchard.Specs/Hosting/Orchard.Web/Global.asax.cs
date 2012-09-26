﻿using System.Web;
using System.Web.Mvc;
using System.Web.Routing;
using Autofac;
using Orchard.Environment;
using Orchard.Environment.Configuration;

namespace Orchard.Specs.Hosting.Orchard.Web {
    public class MvcApplication : HttpApplication {
        private static IOrchardHost _host;

        public MvcApplication() {
        }

        public static void RegisterRoutes(RouteCollection routes) {
            routes.IgnoreRoute("{resource}.axd/{*pathInfo}");
        }

        protected void Application_Start() {
            RegisterRoutes(RouteTable.Routes);
            _host = OrchardStarter.CreateHost(MvcSingletons);
            _host.Initialize();
            
            // initialize shells to speed up the first dynamic query
            _host.BeginRequest();
            _host.EndRequest();
        }

        protected void Application_BeginRequest() {
            Context.Items["originalHttpContext"] = Context;
            _host.BeginRequest();
        }

        protected void Application_EndRequest() {
            _host.EndRequest();
        }

        static void MvcSingletons(ContainerBuilder builder) {
            builder.Register(ctx => RouteTable.Routes).SingleInstance();
            builder.Register(ctx => ModelBinders.Binders).SingleInstance();
            builder.Register(ctx => ViewEngines.Engines).SingleInstance();
        }

        public static void ReloadExtensions() {
            _host.ReloadExtensions();
        }

        public static IWorkContextScope CreateStandaloneEnvironment(string name) {
            var settings = new ShellSettings {
                Name = name,
                State = new TenantState("Uninitialized")
            };

            return _host.CreateStandaloneEnvironment(settings);
        }
    }
}